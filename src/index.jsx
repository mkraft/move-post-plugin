import React from 'react';

// Courtesy of https://feathericons.com/
const Icon = () => <i className='icon fa fa-plug'/>;

class HelloWorldPlugin {
    initialize(registry, store) {
        registry.registerPostDropdownMenuAction(
            'Move Post',
            (postID) => {
                const post = store.getState().entities.posts.posts[postID];
                console.log('postID', postID);
                console.log('post', post);
            },
            (postID) => {
                const post = store.getState().entities.posts.posts[postID];
                if (post && post.root_id.length === 0) {
                    return true;
                }
                return false;
            },
        );
    }
}

window.registerPlugin('com.mattermost.webapp-hello-world', new HelloWorldPlugin());