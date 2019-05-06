import React from 'react';
import { createPostImmediately, deletePost, removePost, editPost } from 'mattermost-redux/actions/posts';
import { getConfig } from 'mattermost-redux/actions/admin';
import { haveIChannelPermission } from 'mattermost-redux/selectors/entities/roles';
import { getCurrentTeamId } from 'mattermost-redux/selectors/entities/teams';
import { getCurrentUser } from 'mattermost-redux/selectors/entities/users';
import { Permissions } from 'mattermost-redux/constants';

const TEMPLATE_VARIABLE_PERMALINK = '{{Permalink}}';
const TEMPLATE_VARIABLE_MOVER_USERNAME = '{{MoverUsername}}';

let moveOthersTemplate = '';

class MovePostPlugin {
    async initialize(registry, store) {
        registry.registerPostDropdownMenuAction(
            'Move to open thread',
            (postID) => this.onClickMenuItem(postID),
            (postID) => this.shouldShowMenuItem(postID)
        );

        const response = await store.dispatch(getConfig());
        const { move_others_template } = response.data.PluginSettings.Plugins[registry.id];
        moveOthersTemplate = move_others_template;
    }

    async onClickMenuItem(postID) {
        const state = store.getState();
        const post = state.entities.posts.posts[postID];
        const { selectedPostId: rhsPostID, selectedChannelId: rhsChannelID } = state.views.rhs;

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
        //         const stateFileInfo = state.entities.files.files[id];
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

        const { id: currentUserID } = getCurrentUser(state);
        if (post.user_id !== currentUserID) {
            const message = this.getReplacementMessage(state, newPostData.id);
            const editingPost = { ...post, ...{ message } };

            const { error: editError } = await store.dispatch(editPost(editingPost));
            if (editError) {
                console.warn(`Error editing old post: ${editError}`);
                return;
            }
            return;
        }

        const { error: deleteErr } = await store.dispatch(deletePost(post));
        if (deleteErr) {
            console.warn(`Error deleting old post: ${deleteErr}`);
            return;
        }

        const { error: removeErr } = store.dispatch(removePost(post));
        if (removeErr) {
            console.warn(`Error removing old post: ${removeErr}`);
            return;
        }
    }

    shouldShowMenuItem(postID) {
        const state = store.getState();
        const post = state.entities.posts.posts[postID];
        const { selectedPostId: threadPostID, selectedChannelId: threadChannelID } = state.views.rhs;

        // Can't move system messages.
        if (!post || !threadPostID) {
            return false;
        }

        // Can't move a message within its own thread.
        if (post.id === threadPostID || post.root_id === threadPostID) {
            return false;
        }

        // The plugin doesn't yet support moving a thread, only an individual post.
        if (state.entities.posts.postsInThread[postID] || post.root_id !== "") {
            return false;
        }

        // The plugin doesn't yet support moving a post with attached files.
        if (post.file_ids) {
            return false;
        }

        const { currentUserId } = state.entities.users;

        let canDoTheMove = false;
        if (post.user_id === currentUserId) {
            canDoTheMove = true;
        } else if (this.isLicensed(state)) {
            const currentTeamID = getCurrentTeamId(state);
            const hasPermissionsToSourceChannel = this.hasRequiredPermissions(state, post.channel_id, currentTeamID);
            const hasPermissionsToTargetChannel = this.hasRequiredPermissions(state, threadChannelID, currentTeamID);
            canDoTheMove = hasPermissionsToSourceChannel && hasPermissionsToTargetChannel;
        }

        return canDoTheMove;
    }

    hasRequiredPermissions(state, channelID, teamID) {
        const baseParam = { channel: channelID, team: teamID };
        const canDeletePost = haveIChannelPermission(state, { ...baseParam, ...{ permission: Permissions.DELETE_OTHERS_POSTS } });
        const canEditPost = haveIChannelPermission(state, { ...baseParam, ...{ permission: Permissions.EDIT_OTHERS_POSTS } });
        return canDeletePost && canEditPost;
    }

    isLicensed(state) {
        let isLicensed = false;
        let val = state.entities.general.license.IsLicensed;
        if (typeof val === "string") {
            isLicensed = val === "true";
        }
        if (typeof val === "boolean") {
            isLicensed = val;
        }
        return isLicensed;
    }

    getReplacementMessage(state, newPostID) {
        const currentTeamID = getCurrentTeamId(state);
        const { username: moverUsername } = getCurrentUser(state);
        const { name: currentTeamName } = state.entities.teams.teams[currentTeamID];
        const { SiteURL: basePath } = state.entities.general.config;
        const permalink = `${basePath}/${currentTeamName}/pl/${newPostID}`
        let replacementMessage = moveOthersTemplate.replace(TEMPLATE_VARIABLE_PERMALINK, permalink);
        replacementMessage = replacementMessage.replace(TEMPLATE_VARIABLE_MOVER_USERNAME, moverUsername);
        return replacementMessage;
    }
}

window.registerPlugin('com.mattermost.move-post-plugin', new MovePostPlugin());