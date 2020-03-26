var gun = Gun();
var user = gun.user();

user.recall({
    sessionStorage: true
});

/************* API for external apps and extensions (NOTE: Internal API is below) *************/

chrome.runtime.onConnectExternal.addListener(function (port) {
    port.onMessage.addListener(async function (request) {

        ////////////////////////////////////////////////////////////////////////////////////////////////////
        if (request.type == "isUserLoggedIn") {
            if (user.is) {
                port.postMessage({
                    type: "loggedIn",
                    response: true
                });
            } else {
                port.postMessage({
                    type: "loggedIn",
                    response: false
                });
                alert("You need to login to use DVO (top right)");
            }
            return true;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type == "getComments") {
            let photo = await getProfilePicture();
            let name = await getName();
            user.get('pageReviews').get(request.pageUrl).get('comments').map().once(function (data, key) {
                if (data) {
                    port.postMessage({
                        type: "pageComments",
                        key: key,
                        response: data.comment,
                        date: data.date,
                        photo: photo,
                        name: name
                    });
                }
            });
            return true;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type == "addComment") {
            if (window.confirm(`This application wants to add a comment`)) {
                user.get('pageReviews').get(request.pageUrl).get('comments').set({
                    comment: request.comment,
                    date: request.date
                });
            }
            return true;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type == "countComments") {
            let count = 0;
            user.get('pageReviews').get(request.pageUrl).get('comments').map().once(function (data) {
                if (data) {
                    count++;
                    port.postMessage({
                        type: "countComments",
                        response: count
                    });
                }
            });
            return true;
        }

        //////////////////////////////////////////////////////////////////////////////////////////////////// 
        else if (request.type == "getProfilePicture") {
            let photo = await getProfilePicture();
            port.postMessage({
                type: "photo",
                photo: photo
            });
            return true;
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////// 
        else if (request.type == "deleteComment") {
            user.get('pageReviews').get(request.pageUrl).get('comments').get(request.commentId).put(null);
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////// 
        else if (request.type == "updateComment") {
            user.get('pageReviews').get(request.pageUrl).get('comments').get(request.commentId).get('comment').put(request.update);
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////// 
        else if (request.type == "likePage") {
            (async function () {

                let numLikes = await getLikes(request.pageUrl);
                let numDislikes = await getDislikes(request.pageUrl);
                let hasLiked = false;
                let hasDisliked = false;

                if (numLikes === null || numLikes === undefined) {
                    numLikes = 1;
                } else {
                    numLikes = Object.keys(numLikes).length;
                    numLikes++;
                    hasLiked = await hasLikedBefore(request.pageUrl);
                }

                if (numDislikes === null || numDislikes === undefined) {
                    numDislikes = 0;
                } else {
                    numDislikes = Object.keys(numDislikes).length;
                    numDislikes--;
                    hasDisliked = await hasDislikedBefore(request.pageUrl);
                }

                if (!hasLiked) {
                    user.get('pageReviews').get(request.pageUrl).get('likes').get(user.is.pub).put(request.date);

                    if (hasDisliked) {
                        removeDislikePage(request.pageUrl);
                    }

                    port.postMessage({
                        type: "fromLikePage",
                        likes: numLikes,
                        dislikes: numDislikes,
                        hasLiked: hasLiked
                    });

                } else {
                    removeLikePage(request.pageUrl);
                    port.postMessage({
                        type: "fromLikePage",
                        likes: numLikes,
                        dislikes: numDislikes,
                        hasLiked: hasLiked
                    });
                }
            })();
            return true;
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////// 
        else if (request.type == "dislikePage") {
            (async function () {
                let numLikes = await getLikes(request.pageUrl);
                let numDislikes = await getDislikes(request.pageUrl);
                let hasLiked = false;
                let hasDisliked = false;

                if (numLikes === null || numLikes === undefined) {
                    numLikes = 0;
                } else {
                    numLikes = Object.keys(numLikes).length;
                    numLikes--;
                    hasLiked = await hasLikedBefore(request.pageUrl);
                }

                if (numDislikes === null || numDislikes === undefined) {
                    numDislikes = 1;
                } else {
                    numDislikes = Object.keys(numDislikes).length;
                    numDislikes++;
                    hasDisliked = await hasDislikedBefore(request.pageUrl);
                }

                if (!hasDisliked) {
                    user.get('pageReviews').get(request.pageUrl).get('dislikes').get(user.is.pub).put(request.date);

                    if (hasLiked) {
                        removeLikePage(request.pageUrl);
                    }

                    port.postMessage({
                        type: "fromDislikePage",
                        likes: numLikes,
                        dislikes: numDislikes,
                        hasDisliked: hasDisliked
                    });

                } else {
                    removeDislikePage(request.pageUrl);
                    port.postMessage({
                        type: "fromDislikePage",
                        likes: numLikes,
                        dislikes: numDislikes,
                        hasDisliked: hasDisliked
                    });
                }
            })();
            return true;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////  
        else if (request.type == "getNumPageLikes") {

            // need to make it harder for people to register
            (async function () {

                let numLikes = await getLikes(request.pageUrl);
                let numDislikes = await getDislikes(request.pageUrl);
                let hasLiked = false;
                let hasDisliked = false;

                if (numLikes === null || numLikes === undefined) {
                    numLikes = 0;
                } else {
                    numLikes = Object.keys(numLikes).length;
                    hasLiked = await hasLikedBefore(request.pageUrl);
                }

                if (numDislikes === null || numDislikes === undefined) {
                    numDislikes = 0;
                } else {
                    numDislikes = Object.keys(numDislikes).length;
                    hasDisliked = await hasDislikedBefore(request.pageUrl);
                }

                console.log("hasLikedBefore :" + hasLiked);
                console.log("hasDislikedBefore :" + hasDisliked);

                port.postMessage({
                    type: "pageLikes",
                    likes: numLikes,
                    dislikes: numDislikes,
                    hasLiked: hasLiked,
                    hasDisliked: hasDisliked
                });
            })();

            return true;
        }
    });
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    /********** Helper functions **********/

    function removeLikePage(pageUrl) {
        user.get('pageReviews').get(pageUrl).get('likes').map().once(function (data, key) {
            if (data.pubkey === user.is.pub) {
                user.get('pageReviews').get(pageUrl).get('likes').get(key).put(null);
                console.log("like has been removed for: " + pageUrl);
            }
        });
    }

    function removeDislikePage(pageUrl) {
        user.get('pageReviews').get(pageUrl).get('dislikes').map().once(function (data, key) {
            if (data.pubkey === user.is.pub) {
                user.get('pageReviews').get(pageUrl).get('dislikes').get(key).put(null);
                console.log("dislike has been removed for: " + pageUrl);
            }
        });
    }



    async function getLikes(pageUrl) {
        return new Promise(resolve => {
            user.get('pageReviews').get(pageUrl).get('likes').once(function (data) {
                resolve(data);
            });
        });
    }

    async function getDislikes(pageUrl) {
        return new Promise(resolve => {
            user.get('pageReviews').get(pageUrl).get('dislikes').once(function (data) {
                resolve(data);
            });
        });
    }

    async function hasLikedBefore(pageUrl) {
        return new Promise(resolve => {
            user.get('pageReviews').get(pageUrl).get('likes').map().once(function (data, key) {
                console.log(data);
                if (data) {
                    if (key === user.is.pub) { // can squeeze this onto one line
                        resolve(true);
                    }
                } else {
                    resolve(false);
                }
            });
        });
    }


    async function hasDislikedBefore(pageUrl) {
        return new Promise(resolve => {
            user.get('pageReviews').get(pageUrl).get('dislikes').map().once(function (data, key) {
                console.log(data);
                if (data) {
                    if (key === user.is.pub) {
                        resolve(true);
                    }
                } else {
                    resolve(false);
                }
            });
        });
    }

    async function getProfilePicture(pageUrl) {
        return new Promise(resolve => {
            user.get('profile').get('photo').once(function (photo) {
                resolve(photo);
            });
        });
    }

    async function getName() {
        return new Promise(resolve => {
            user.get('profile').get('name').once(function (name) {
                resolve(name);
            });
        });
    }
});

/*************** on right click - post image to newsfeed ***************/

chrome.runtime.onInstalled.addListener(function () {
    var title = "Make profile picture";
    var context = "image";
    var id = chrome.contextMenus.create({
        "title": title,
        "contexts": [context],
        "id": "context" + context
    });
});

chrome.contextMenus.onClicked.addListener(onClickHandler);

function onClickHandler(info, tab) {
    //if (window.confirm(`Are you sure you want to post ${info.srcUrl} to your DVO newsfeed?`)) {}
    user.get('profile').get('photo').put(info.srcUrl);
}

/*
Gun.on('opt', function (ctx) {
    if (ctx.once) {
        return
    }
    ctx.on('in', function (msg) {
        var to = this.to;
        let str = JSON.stringify(msg, null, ' ');
        if (str.length < 200) {
            console.log('This record is valid' + str);
        } else {
            to.next(msg);
        }
    });
});*/

/***** Internal API for login and registration *****/

chrome.runtime.onConnect.addListener(function (port) {
    console.assert(port.name == "dvo"); // Do i need this? 
    port.onMessage.addListener(async function (request) {

        ////////////////////////////////////////////////////////////////////////////////////////////////////
        if (request.type == "isUserLoggedIn") {
            if (user.is) {
                port.postMessage({
                    type: "loggedIn",
                    response: true
                });
            } else {
                port.postMessage({
                    type: "loggedIn",
                    response: false
                });
            }
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type == "register") {
            user.create(request.username, request.password, function () {
                user.auth(request.username, request.password, function () {
                    port.postMessage({
                        response: true
                    });
                    user.get('profile').get('name').put(request.name);
                    let profilePicUrl = "https://glensimister.files.wordpress.com/2014/12/profilepic.jpg?w=660";
                    user.get('profile').get('photo').put(profilePicUrl);
                });
            });
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type == "login") {
            user.auth(request.username, request.password, function () {
                port.postMessage({
                    response: true
                });
            });
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type == "logout") {
            user.leave();
        }
    });
});
