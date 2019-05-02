import React from 'react';

import { createPostImmediately } from 'mattermost-redux/actions/posts';

// const css = ``;

class HelloWorldPlugin {
    initialize(registry, store) {
        // this.addStyles();

        registry.registerPostDropdownMenuAction(
            'Move to open thread',
            (postID) => {
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

                store.dispatch(createPostImmediately(newPost, files));

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

    // addStyles() {
    //     const style = document.createElement('style');
    //     document.head.appendChild(style);
    //     style.type = 'text/css';
    //     style.appendChild(document.createTextNode(css));
    // }
}

window.registerPlugin('com.mattermost.webapp-hello-world', new HelloWorldPlugin());