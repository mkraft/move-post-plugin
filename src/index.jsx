import React from 'react';
import { Draggable, Droppable } from '@shopify/draggable';
import styles from '../assets/styles.css';

// Courtesy of https://feathericons.com/
const Icon = () => <i className='icon fa fa-plug' />;

class HelloWorldPlugin {
    initialize(registry, store) {
        registry.registerPostDropdownMenuAction(
            'Move Post',
            (postID) => {
                const dropElem = document.getElementById("rhsContainer");
                if (!dropElem) {
                    console.log('do nothing');
                    return;
                }
                const postElem = document.getElementById(`post_${postID}`); // postListContent
                const draggable = new Draggable(postElem, {
                    draggable: '.post__content'
                });
                draggable.on('drag:start', () => console.log('drag:start'));
                draggable.on('drag:move', () => console.log('drag:move'));
                draggable.on('drag:stop', () => console.log('drag:stop'));

                // const post = store.getState().entities.posts.posts[postID];

                const droppable = new Droppable(dropElem, {
                    draggable: '.post__content'
                });
                droppable.on('droppable:dropped', () => console.log('droppable:dropped'));
                droppable.on('droppable:returned', () => console.log('droppable:returned'));
            },
            (postID) => {
                // TODO: Return false if the LHS is not open.
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