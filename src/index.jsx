import React from 'react';

import { createPostImmediately, deletePost, removePost, editPost } from 'mattermost-redux/actions/posts';
import { getConfig } from 'mattermost-redux/actions/admin';
import { haveIChannelPermission } from 'mattermost-redux/selectors/entities/roles';
import { getCurrentTeamId } from 'mattermost-redux/selectors/entities/teams';
import { Permissions } from 'mattermost-redux/constants';

let behaviour = '';
let templateStr = '';

class MovePostPlugin {
    async initialize(registry, store) {
        registry.registerPostDropdownMenuAction(
            'Move to open thread',
            (postID) => this.onClickMenuItem(postID),
            (postID) => this.shouldShowMenuItem(postID)
        );

        const response = await store.dispatch(getConfig());
        const { originalpostbehaviour, template } = response.data.PluginSettings.Plugins['com.mattermost.move-post-plugin'];
        behaviour = originalpostbehaviour;
        templateStr = template;
    }

    async onClickMenuItem(postID) {
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

        // if (post.file_ids) {
        //     files = post.file_ids.map((id) => {
        //         const stateFileInfo = store.getState().entities.files.files[id];
        //         const fileInfo = { ...stateFileInfo };
        //         delete fileInfo.post_id;
        //         return fileInfo;
        //     });
        // }

        const { error: createErr, data: newPostData } = await store.dispatch(createPostImmediately(newPost, files));
        if (createErr) {
            console.warn(`Error creating new post: ${createErr}`);
            return;
        }

        console.log('behaviour', behaviour);

        if (behaviour === 'template') {
            const currentTeamID = getCurrentTeamId(store.getState());
            const { name: currentTeamName } = store.getState().entities.teams.teams[currentTeamID];
            const { SiteURL: basePath } = store.getState().entities.general.config;
            const permalink = `${basePath}/${currentTeamName}/pl/${newPostData.id}`
            const replacementMessage = templateStr.replace('{{Permalink}}', permalink);
            const editingPost = { ...post };
            editingPost.message = replacementMessage;
            const { error: editError } = await store.dispatch(editPost(editingPost));
            if (editError) {
                console.warn(`Error editing old post: ${editError}`);
                return;
            }
        } else {
            const { error: deleteErr } = await store.dispatch(deletePost(post));
            if (deleteErr) {
                console.warn(`Error deleting old post: ${deleteErr}`);
                return;
            }

            const { error: removeErr } = store.dispatch(removePost(post));
            if (removeErr) {
                console.warn(`Error removing old post: ${removeErr}`);
            }
        }
    }

    shouldShowMenuItem(postID) {
        const post = store.getState().entities.posts.posts[postID];
        const { selectedPostId: threadPostID, selectedChannelId: threadChannelID } = store.getState().views.rhs;

        // Can't move system messages.
        if (!post || !threadPostID) {
            return false;
        }

        // Can't move a message within its own thread.
        if (post.id === threadPostID) {
            return false;
        }

        // The plugin doesn't yet support moving a thread, only an individual post.
        if (store.getState().entities.posts.postsInThread[postID]) {
            return false;
        }

        // The plugin doesn't yet support moving a post with attached files.
        if (post.file_ids) {
            return false;
        }

        const { currentUserId } = store.getState().entities.users;

        let canDoTheMove = false;
        if (post.user_id === currentUserId) {
            canDoTheMove = true;
        } else if (this.isLicensed(store)) {
            const currentTeamID = getCurrentTeamId(store.getState());
            const hasPermissionsToSourceChannel = this.hasRequiredPermissions(post.channel_id, currentTeamID);
            const hasPermissionsToTargetChannel = this.hasRequiredPermissions(threadChannelID, currentTeamID);
            canDoTheMove = hasPermissionsToSourceChannel && hasPermissionsToTargetChannel;
        }

        return canDoTheMove;
    }

    hasRequiredPermissions(channelID, teamID) {
        const baseParam = { channel: channelID, team: teamID };
        const canDeletePost = haveIChannelPermission(store.getState(), { ...baseParam, ...{ permission: Permissions.DELETE_OTHERS_POSTS } });
        const canEditPost = haveIChannelPermission(store.getState(), { ...baseParam, ...{ permission: Permissions.EDIT_OTHERS_POSTS } });
        return canDeletePost && canEditPost;
    }

    isLicensed(store) {
        let isLicensed = false;
        let val = store.getState().entities.general.license.IsLicensed;
        if (typeof val === "string") {
            isLicensed = val === "true";
        }
        if (typeof val === "boolean") {
            isLicensed = val;
        }
        return isLicensed;
    }
}

window.registerPlugin('com.mattermost.move-post-plugin', new MovePostPlugin());