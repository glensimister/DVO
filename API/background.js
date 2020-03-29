var gun = Gun();
var user = gun.user();

user.recall({
    sessionStorage: true
});

/************* API for external apps and extensions (NOTE: Internal API is below) *************/

chrome.runtime.onConnectExternal.addListener(function (port) {
    port.onMessage.addListener(async function (request) {

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
            (async function () {
                let page = user.get('pageReviews').get(request.pageUrl);
                let comments = await getComments();

                // why do i need setTimeout? Without this the full array won't load
                setTimeout(function () {
                    let json = JSON.stringify(comments);
                    let len = comments.length;
                    console.log(len);
                    console.log("JSON: " + json);
                    port.postMessage({
                        type: "pageComments",
                        comments: json,
                        count: len
                    });
                }, 100);

                // get comments and filter out any duplicates
                async function getComments() {
                    let array = [];
                    let keys = [];
                    let obj = {};
                    return new Promise(resolve => {
                        page.get('comments').map().once(function (data, key) {
                            if (data) {
                                if (keys.includes(key)) {
                                    console.log("duplicate data. skipping...");
                                } else {
                                    obj = {
                                        key: key,
                                        comment: data.comment,
                                        date: data.date,
                                        photo: data.photo,
                                        name: data.name
                                    }
                                    keys.push(key);
                                    array.push(obj);
                                    resolve(array);
                                }
                            }
                        });
                    });
                }
                return true;
            })();
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type == "addComment") {
            if (window.confirm(`This application wants to add a comment`)) {
                let photo = await getProfilePicture();
                let name = await getName();
                user.get('pageReviews').get(request.pageUrl).get('comments').set({
                    comment: request.comment,
                    date: request.date,
                    name: name,
                    photo: photo
                });
            }
            return true;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type == "getProfilePicture") { //is this still being used? 
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
        else if (request.type == "reaction") {
            (async function () {

                let hasLiked = await hasLikedBefore(request.pageUrl, 'likes');
                let hasDisliked = await hasLikedBefore(request.pageUrl, 'dislikes');
                let page = user.get('pageReviews').get(request.pageUrl);
                let id = user.is.pub;

                //hasLiked and hasDisliked are arrays, e.g. 
                //hasLiked[0] : true or false
                //hasLiked[1] : the key of the object

                if (request.reactType === 'like') {
                    if (hasLiked[0]) {
                        console.log("deleting: " + hasLiked[1]);
                        page.get('likes').get(hasLiked[1]).put(null);
                    } else {
                        page.get('likes').set({
                            userId: id
                        });
                    }
                    if (hasDisliked[0]) {
                        console.log("deleting: " + hasDisliked[1]);
                        page.get('likes').get(hasDisliked[1]).put(null);
                    }
                }

                if (request.reactType === 'dislike') {
                    if (hasDisliked[0]) {
                        console.log("deleting: " + hasDisliked[1]);
                        page.get('likes').get(hasDisliked[1]).put(null);
                    } else {
                        page.get('dislikes').set({
                            userId: id
                        });
                    }
                    if (hasLiked[0]) {
                        console.log("deleting: " + hasLiked[1]);
                        page.get('likes').get(hasLiked[1]).put(null);
                    }
                }

                let numLikes = await getLikes(request.pageUrl, 'likes');
                let numDislikes = await getLikes(request.pageUrl, 'dislikes');

                port.postMessage({
                    type: "pageLikes",
                    likes: numLikes,
                    dislikes: numDislikes,
                    hasLiked: hasLiked[0],
                    hasDisliked: hasDisliked[0]
                });

            })();
            return true;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////  
        else if (request.type == "getNumPageLikes") {

            (async function () {

                let numLikes = await getLikes(request.pageUrl, 'likes');
                console.log("numLikes:  " + numLikes);
                let numDislikes = await getLikes(request.pageUrl, 'dislikes');
                let hasLiked = await hasLikedBefore(request.pageUrl, 'likes');
                let hasDisliked = await hasLikedBefore(request.pageUrl, 'dislikes');

                port.postMessage({
                    type: "pageLikes",
                    likes: numLikes,
                    dislikes: numDislikes,
                    hasLiked: hasLiked[0],
                    hasDisliked: hasDisliked[0]
                });
            })();

            return true;
        }
    });
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    /********** Helper functions **********/

    /*async function getLikes(pageUrl, type) {
        return new Promise(resolve => {
            user.get('pageReviews').get(pageUrl).get(type).once(function (data) {
                console.log(data);
                if (data === null || data === undefined) {
                    resolve(0);
                } else {
                    let len = Object.keys(data).length - 1;
                    console.log("Length: " + len);
                    resolve(len);
                }
            });
        });
    }*/

    async function getLikes(pageUrl, type) {
        let count = 0;
        return new Promise(resolve => {
            const record = user.get('pageReviews').get(pageUrl).get(type);
            record.once(function (data) {
                if (data === undefined || data === null) {
                    resolve(0);
                } else {
                    record.map().once(function (data) {
                        if (data === null) {
                            count--;
                        }
                        count++;
                        console.log(count);
                        resolve(count);
                    });
                }
            });
        });
    }

    async function hasLikedBefore(pageUrl, type) {
        let id = user.is.pub;
        return new Promise(resolve => {
            const record = user.get('pageReviews').get(pageUrl).get(type);
            record.once(function (data) {
                if (data === undefined || data === null) {
                    resolve([false, undefined]);
                } else {
                    record.map().once(function (data, key) {
                        if (data !== null) {
                            if (data.userId === id) {
                                resolve([true, key]);
                            }
                        } else {
                            resolve([false, undefined]);
                        }
                    });
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
