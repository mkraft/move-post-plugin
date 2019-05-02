import React from 'react';

import { createPostImmediately, deletePost, removePost } from 'mattermost-redux/actions/posts';

class MovePostPlugin {
    initialize(registry, store) {
        registry.registerPostDropdownMenuAction(
            'Move to open thread',
            async (postID) => {
                const post = store.getState().entities.posts.posts[postID];
                const { selectedPostId: rhsPostID, selectedChannelId: rhsChannelID } = store.getState().views.rhs;
                if (!post || !rhsPostID) {
                    console.warn(`not able to move post_id: ${post.id}, rhsPostID: ${rhsPostID}`);
                    return
                }

                const now = Date.now();

                const newPost = {
                    "file_ids": [],
                    "message": post.message,
                    "channel_id": rhsChannelID,
                    "root_id": rhsPostID,
                    "parent_id": rhsPostID,
                    "pending_post_id": `${post.user_id}:${now}`,
                    "user_id": post.user_id,
                    "create_at": now
                };

                let files = [];

                if (post.file_ids) {
                    files = post.file_ids.map((id) => {
                        const stateFileInfo = store.getState().entities.files.files[id];
                        const fileInfo = { ...stateFileInfo };
                        delete fileInfo.post_id;
                        return fileInfo;
                    });
                }

                await store.dispatch(createPostImmediately(newPost, files));
                await store.dispatch(deletePost(post));
                store.dispatch(removePost(post));

                // TODO: Figure out why files aren't moving over successfully.
            },
            (postID) => {
                // Filter-out system messages.
                const post = store.getState().entities.posts.posts[postID];
                const threadPostID = store.getState().views.rhs.selectedPostId;
                if (post && threadPostID && (post.id !== threadPostID)) {
                    return true;
                }
                return false;
            },
        );
    }
}

window.registerPlugin('com.mattermost.move-post-plugin', new MovePostPlugin());