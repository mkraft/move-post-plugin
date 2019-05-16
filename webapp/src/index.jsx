import React from 'react';
import axios from 'axios';
import { createPostImmediately, deletePost, removePost, editPost } from 'mattermost-redux/actions/posts';
import { getConfig } from 'mattermost-redux/actions/admin';
import { haveIChannelPermission } from 'mattermost-redux/selectors/entities/roles';
import { getCurrentTeamId } from 'mattermost-redux/selectors/entities/teams';
import { getCurrentUser } from 'mattermost-redux/selectors/entities/users';
import { Permissions } from 'mattermost-redux/constants';

let pluginID = '';

class MovePostPlugin {
    async initialize(registry, store) {
        registry.registerPostDropdownMenuAction(
            'Move to open thread',
            (postID) => this.onClickMenuItem(postID),
            (postID) => this.shouldShowMenuItem(postID)
        );
        
        // TODO: Register custom post type to render moved posts with a badge, or something.
        // registry.registerPostTypeComponent("custom_moved_post", component);
        
        pluginID = registry.id;
    }

    async onClickMenuItem(postID) {
        const state = store.getState();
        const { selectedPostId: rhsPostID } = state.views.rhs;
        const instance = axios.create({
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            }
        });
        instance.post(`/plugins/${pluginID}/api/v1/posts/${postID}/move`, { thread_id: rhsPostID });
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
}

window.registerPlugin('com.mattermost.move-post-plugin', new MovePostPlugin());