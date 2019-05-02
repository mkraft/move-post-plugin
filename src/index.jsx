import React from 'react';

import { createPostImmediately, deletePost, removePost } from 'mattermost-redux/actions/posts';
import { haveIChannelPermission } from 'mattermost-redux/selectors/entities/roles';
import { getCurrentTeamId } from 'mattermost-redux/selectors/entities/teams';
import { Permissions } from 'mattermost-redux/constants';

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
                const { selectedPostId: threadPostID, selectedChannelId: threadChannelID } = store.getState().views.rhs;

                if (!post || !threadPostID) {
                    return false;
                }

                const { currentUserId } = store.getState().entities.users;
                const currentTeamID = getCurrentTeamId(store.getState());

                let canDoTheMove = false;
                if (post.user_id === currentUserId) {
                    canDoTheMove = true;
                } else {
                    const hasPermissionToSourceChannel = this.hasPermissionToEditAndDelete(post.channel_id, currentTeamID);
                    const hasPermissionToTargetChannel = this.hasPermissionToEditAndDelete(threadChannelID, currentTeamID);
                    canDoTheMove = hasPermissionToSourceChannel && hasPermissionToTargetChannel;
                }

                if ((post.id !== threadPostID) && canDoTheMove) {
                    return true;
                }

                return false;
            },
        );
    }

    hasPermissionToEditAndDelete(channelID, teamID) {
        const baseParam = { channel: channelID, team: teamID };
        const canDeletePost = haveIChannelPermission(store.getState(), { ...baseParam, ...{ permission: Permissions.DELETE_OTHERS_POSTS } });
        const canEditPost = haveIChannelPermission(store.getState(), { ...baseParam, ...{ permission: Permissions.EDIT_OTHERS_POSTS } });
        return canDeletePost && canEditPost;
    }
}

window.registerPlugin('com.mattermost.move-post-plugin', new MovePostPlugin());