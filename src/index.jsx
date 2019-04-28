import React from 'react';

const css = `
    div.custom-textarea.move_post_target {
        animation: blinker 1s linear infinite;
        background-color: yellow;
    }

    @keyframes blinker {
        50% {
          opacity: 0;
        }
    }
`;

let unsubscribe = () => { };
let postTextboxElement;

class HelloWorldPlugin {
    initialize(registry, store) {
        this.addStyles();

        const initialState = { originalPostID: null, newPostID: null };

        registry.registerReducer((state = initialState, action) => {
            switch (action.type) {
                case 'MOVE_POST_START':
                    return Object.assign({}, state, {
                        originalPostID: action.postID
                    })
                case 'MOVE_POST_PASTE':
                    return Object.assign({}, state, {
                        originalPostID: action.postID
                    })
                case 'MOVE_POST_RESET':
                    return initialState;
                default:
                    return state
            }
        });

        registry.registerPostDropdownMenuAction(
            'Move Post',
            (postID) => {
                // const post = store.getState().entities.posts.posts[postID];
                store.dispatch({ type: 'MOVE_POST_START', postID });
                postTextboxElement = document.getElementById('post_textbox')
                postTextboxElement.onclick = this.handleFocus;

                let currentSelectedPostID;


                unsubscribe = store.subscribe(() => {

                    let waitForElementToDisplay = (domString, f) => {
                        const element = document.querySelector(domString);
                        if (element != null) {
                            f(element);
                        } else {
                            setTimeout(() => {
                                waitForElementToDisplay(domString, f);
                            }, 50);
                        }
                    }

                    let previousSelectedPostID = currentSelectedPostID;
                    currentSelectedPostID = store.getState().views.rhs.selectedPostId;
                    if (previousSelectedPostID !== currentSelectedPostID) {
                        if (currentSelectedPostID !== '') {
                            waitForElementToDisplay('#reply_textbox', (elemnent) => {
                                elemnent.onclick = this.handleFocus;
                            })
                        } else {
                            waitForElementToDisplay('#reply_textbox', (elemnent) => {
                                elemnent.onclick = null;
                            })
                        }
                    }
                });
            },
            (postID) => {
                // Filter-out system messages.
                const post = store.getState().entities.posts.posts[postID];
                if (post) {
                    return true;
                }
                return false;
            },
        );
    }

    handleFocus(event) {
        event.target.onclick = null;
        if (event.target !== postTextboxElement) {
            postTextboxElement.onclick = null;
        }
        const textareaOverlayElem = document.querySelector('div.custom-textarea');
        textareaOverlayElem.classList.add("move_post_target");
        const originalPlaceholder = textareaOverlayElem.innerHTML;
        textareaOverlayElem.innerText = 'Move post here?';
        
        // This setTimeout probably won't be necessary if we don't use a browser confirm.
        setTimeout(() => {
            if (confirm("Move post?")) {
                console.log('doing it!');
            } else {
                console.log('cancelling');
            }
            textareaOverlayElem.innerText = originalPlaceholder;
            textareaOverlayElem.classList.remove("move_post_target");
            unsubscribe();
            unsubscribe = () => { };
        }, 250);
    }

    addStyles() {
        const style = document.createElement('style');
        document.head.appendChild(style);
        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
    }
}



window.registerPlugin('com.mattermost.webapp-hello-world', new HelloWorldPlugin());