//var gun = Gun(['https://guntest.herokuapp.com/gun']);
var gun = Gun();
var user = gun.user();

user.recall({
    sessionStorage: true
});

/************* API for external apps and extensions (NOTE: Internal API is below) *************/

chrome.runtime.onConnectExternal.addListener(function (port) {
    port.onMessage.addListener(async function (request) {

        if (request.type === "isUserLoggedIn") {
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
                //alert("You need to login to use DVO (top right)");
            }
            return true;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "saveResume") {
            if (window.confirm(`Confirm save`)) {
                user.get('profile').get(request.userId).get('resume').put(request.update);
            }
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "updateProfile") {
            if (window.confirm(`Confirm save ${request.field}`)) {
                user.get('profile').get(request.userId).get(request.field).put(request.update);
                user.get('profile').get(request.userId).get(request.field).once(function (data) {
                    console.log(data);
                });
            }
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "getProfile") {
            user.get('profile').get(request.userId).once(function (data) {
                console.log(data);
                if (data !== undefined) {
                    port.postMessage({
                        type: "getProfile",
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        location: data.location,
                        resume: data.resume,
                        photo: data.photo
                    });
                }
            });
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "countComments") {
            // still need to filter out undefined, nulls and duplicates
            let num = await countComments();
            setTimeout(function () {
                port.postMessage({
                    type: "countComments",
                    count: num
                });
            }, 500);
            async function countComments() {
                return new Promise(async resolve => {
                    await user.get('pageReviews').get(request.pageUrl).get('comments').once(function (data) {
                        if (data === undefined || data === null) {
                            resolve(0);
                        } else {
                            let len = Object.keys(data).length - 1;
                            resolve(len);
                        }
                    });
                });
            }
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "getComments") {
            (async function () {
                let chain = user.get('pageReviews').get(request.pageUrl).get('comments');
                let has = await hasData();
                if (has) {
                    let comments = await getComments();
                    setTimeout(function () {
                        let json = JSON.stringify(comments);
                        let len = comments.length;
                        port.postMessage({
                            type: "pageComments",
                            comments: json,
                            count: len
                        });
                    }, 500);
                } else {
                    port.postMessage({
                        type: "pageComments",
                        comments: null,
                        count: 0
                    });
                }

                async function hasData() {
                    return new Promise(resolve => {
                        chain.once(function (data) {
                            if (data === undefined) {
                                resolve(false);
                            } else {
                                resolve(true);
                            }
                        });
                    });
                }

                async function getComments() {
                    let array = [];
                    let keys = [];
                    let obj = {};
                    let hasLiked = false;
                    let hasDisliked = false;
                    return new Promise(async resolve => {
                        await chain.map().once(function (data, key) {
                            if (data.comment !== null) {
                                if (keys.includes(key)) {
                                    console.log("duplicate data. skipping...");
                                } else {
                                    let score = calculatePageScore(data.likes, data.dislikes);
                                    obj = {
                                        key: data.commentId,
                                        comment: data.comment,
                                        date: data.date,
                                        photo: data.photo,
                                        name: data.name,
                                        likes: data.likes,
                                        dislikes: data.dislikes,
                                        hasLiked: hasLiked,
                                        hasDisliked: hasDisliked,
                                        score: score
                                    }
                                    keys.push(key);
                                    array.push(obj);
                                }
                            }
                        });
                        resolve(array);
                    });
                }

                async function getPageLikes(commentId) {
                    return new Promise(resolve => {
                        user.get('pageReviews').get(commentId).get('likes').once(function (data) {
                            resolve(data.likes);
                        });
                    });
                }

                async function getPageDislikes(commentId) {
                    return new Promise(resolve => {
                        user.get('pageReviews').get(commentId).get('likes').once(function (data) {
                            resolve(data.likes);
                        });
                    });
                }
            })();
            return true;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "addComment") {
            if (window.confirm(`Confirm add comment`)) {
                let photo = await getProfilePicture();
                let name = await getName();
                let userId = user.is.pub;
                user.get('pageReviews').get(request.pageUrl).get('comments').get(request.commentId).put({
                    commentId: request.commentId,
                    comment: request.comment,
                    date: request.date,
                    name: name,
                    photo: photo,
                    userId: userId,
                    likes: 0,
                    dislikes: 0,
                    score: 100
                });
                port.postMessage({
                    type: "commentAdded"
                });
            }
            return true;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "getProfilePicture") { //is this still being used? 
            let photo = await getProfilePicture();
            port.postMessage({
                type: "photo",
                photo: photo
            });
            return true;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "likeComment") {
            if (window.confirm(`Confirm like comment`)) {
                (async function () {
                    let likes = 0;
                    let dislikes = 0;
                    let likedAlready = false;
                    let dislikedAlready = false;
                    let score = 0;
                    let pubKey = user.is.pub;
                    let chain = user.get('pageReviews').get(request.pageUrl).get('comments').get(request.commentId);
                    let hasLikes = await hasData('likes');
                    let hasDislikes = await hasData('dislikes');

                    if (hasLikes) {
                        likes = await getPageLikes();
                        likedAlready = await chain.get('users').get('likes').get(pubKey);
                    }

                    if (hasDislikes) {
                        dislikes = await getPageDislikes();
                        dislikedAlready = await chain.get('users').get('dislikes').get(pubKey);
                    }

                    console.log(`${likes} / ${dislikes} / ${likedAlready} / ${dislikedAlready}`);

                    if (request.reactType === 'like') {
                        if (!likedAlready) {
                            likes++;
                            chain.get('likes').put(likes);
                            chain.get('users').get('likes').get(pubKey).put(true);
                        }

                        if (likedAlready) {
                            likes--;
                            chain.get('likes').put(likes);
                            chain.get('users').get('likes').get(pubKey).put(false);
                        }

                        if (dislikedAlready) {
                            dislikes--;
                            chain.get('dislikes').put(dislikes);
                            chain.get('users').get('dislikes').get(pubKey).put(false);
                        }
                    } else if (request.reactType === 'dislike') {
                        if (!dislikedAlready) {
                            dislikes++;
                            chain.get('dislikes').put(dislikes);
                            chain.get('users').get('dislikes').get(pubKey).put(true);
                        }

                        if (dislikedAlready) {
                            dislikes--;
                            chain.get('dislikes').put(dislikes);
                            chain.get('users').get('dislikes').get(pubKey).put(false);
                        }

                        if (likedAlready) {
                            likes--;
                            chain.get('likes').put(likes);
                            chain.get('users').get('likes').get(pubKey).put(false);
                        }
                    }

                    score = calculatePageScore(likes, dislikes);

                    port.postMessage({
                        type: 'getCommentLikes',
                        likes: likes,
                        dislikes: dislikes,
                        score: score,
                        likedAlready: likedAlready,
                        dislikedAlready: dislikedAlready
                    });

                    async function getPageLikes() {
                        return new Promise(resolve => {
                            chain.get('likes').once(function (data) {
                                resolve(data);
                            });
                        });
                    }

                    async function getPageDislikes() {
                        return new Promise(resolve => {
                            chain.get('dislikes').once(function (data) {
                                resolve(data);
                            });
                        });
                    }

                    async function hasData(type) {
                        return new Promise(resolve => {
                            chain.get(type).once(function (data) {
                                if (data === undefined) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        });
                    }
                })();
                return true;
            }
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////// 
        else if (request.type === "deleteComment") {
            if (window.confirm(`Confirm delete comment`)) {
                let comment = user.get('pageReviews').get(request.pageUrl).get('comments').get(request.commentId);
                comment.get('commentId').put(null);
                comment.get('comment').put(null);
                comment.get('date').put(null);
                comment.get('name').put(null);
                comment.get('photo').put(null);
                comment.get('userId').put(null);
                comment.get('likes').put(null);
                comment.get('dislikes').put(null);
                comment.get('score').put(null);
                port.postMessage({
                    type: 'commentDeleted'
                });
            }
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////// 
        else if (request.type === "updateComment") {
            if (window.confirm(`Confirm edit comment`)) {
                user.get('pageReviews').get(request.pageUrl).get('comments').get(request.commentId).get('comment').put(request.update);
            }
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////// 
        else if (request.type === "likePage") {
            if (window.confirm(`Confirm like page`)) {
                (async function () {
                    let likes = 0;
                    let dislikes = 0;
                    let likedAlready = false;
                    let dislikedAlready = false;
                    let score = 0;
                    let pubKey = user.is.pub;
                    let chain = user.get('pageReviews').get(request.pageUrl);
                    //let likesChain = user.get('pageReviews').get(request.pageUrl).get('likes');
                    //let dislikesChain = user.get('pageReviews').get(request.pageUrl).get('dislikes');
                    let likesChainIsEmpty = await isEmpty('pageReviews', request.pageUrl, 'likes');
                    let dislikesChainIsEmpty = await isEmpty('pageReviews', request.pageUrl, 'dislikes');

                    if (!likesChainIsEmpty) {
                        likes = await getPageLikes();
                        likedAlready = await chain.get('likes').get('users').get(pubKey);
                    }

                    if (!dislikesChainIsEmpty) {
                        dislikes = await getPageDislikes();
                        dislikedAlready = await chain.get('dislikes').get('users').get(pubKey);
                    }

                    if (request.reactType === 'like') {
                        if (!likedAlready) {
                            likes++;
                            await chain.get('likes').put({
                                likes: likes
                            });
                            await chain.get('likes').get('users').get(pubKey).put(true);
                        }

                        if (likedAlready) {
                            likes--;
                            await chain.get('likes').put({
                                likes: likes
                            });
                            await chain.get('likes').get('users').get(pubKey).put(false);
                        }

                        if (dislikedAlready) {
                            dislikes--;
                            await chain.get('dislikes').put({
                                dislikes: dislikes
                            });
                            await chain.get('dislikes').get('users').get(pubKey).put(false);
                        }
                    } else if (request.reactType === 'dislike') {
                        if (!dislikedAlready) {
                            dislikes++;
                            await chain.get('dislikes').put({
                                dislikes: dislikes
                            });
                            await chain.get('dislikes').get('users').get(pubKey).put(true);
                        }

                        if (dislikedAlready) {
                            dislikes--;
                            await chain.get('dislikes').put({
                                dislikes: dislikes
                            });
                            await chain.get('dislikes').get('users').get(pubKey).put(false);
                        }

                        if (likedAlready) {
                            likes--;
                            await chain.get('likes').put({
                                likes: likes
                            });
                            await chain.get('likes').get('users').get(pubKey).put(false);
                        }
                    }

                    score = calculatePageScore(likes, dislikes);

                    port.postMessage({
                        type: 'getPageLikes',
                        likes: likes,
                        dislikes: dislikes,
                        score: score,
                        likedAlready: likedAlready,
                        dislikedAlready: dislikedAlready
                    });

                    async function getPageLikes() {
                        return new Promise(resolve => {
                            chain.get('likes').once(function (data) {
                                resolve(data.likes);
                            });
                        });
                    }

                    async function getPageDislikes() {
                        return new Promise(resolve => {
                            chain.get('dislikes').once(function (data) {
                                resolve(data.dislikes);
                            });
                        });
                    }
                })();
            }
            return true;
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////// 
        else if (request.type === "getPageLikes") {
            (async function () {
                let likes = 0;
                let dislikes = 0;
                let likedAlready = false;
                let dislikedAlready = false;
                let score = 0;
                let pubKey = user.is.pub;
                let likesChain = user.get('pageReviews').get(request.pageUrl).get('likes');
                let dislikesChain = user.get('pageReviews').get(request.pageUrl).get('dislikes');
                let likesChainIsEmpty = await isEmpty('pageReviews', request.pageUrl, 'likes');
                let dislikesChainIsEmpty = await isEmpty('pageReviews', request.pageUrl, 'dislikes');

                if (!likesChainIsEmpty) {
                    likes = await getPageLikes();
                    likedAlready = await likesChain.get('users').get(pubKey);
                }

                if (!dislikesChainIsEmpty) {
                    dislikes = await getPageDislikes();
                    dislikedAlready = await dislikesChain.get('users').get(pubKey);
                }

                score = calculatePageScore(likes, dislikes);

                port.postMessage({
                    type: 'getPageLikes',
                    likes: likes,
                    dislikes: dislikes,
                    score: score,
                    likedAlready: likedAlready,
                    dislikedAlready: dislikedAlready
                });

                async function getPageLikes() {
                    return new Promise(resolve => {
                        likesChain.once(function (data) {
                            resolve(data.likes);
                        });
                    });
                }

                async function getPageDislikes() {
                    return new Promise(resolve => {
                        dislikesChain.once(function (data) {
                            resolve(data.dislikes);
                        });
                    });
                }
            })();
            return true;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "getAll") {
            getAll(request.pageUrl, request.itemId, request.reactType);
            return true;
        }
    });
    ////////////////////////////////////////////////////////////////////////////////////////////////////


    /********** Helper functions **********/

    async function isEmpty(table, pageUrl, type) {
        return new Promise(resolve => {
            user.get(table).get(pageUrl).get(type).once(function (data) {
                if (data === undefined) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }

    function getAll(pageUrl, itemId, type) {
        let array = [];
        user.get('pageReviews').get(pageUrl).get(type).map().on(function (data, key) {
            if (data !== undefined) {
                if (data.userId === null) {
                    console.log(`Found a ${data.userId} object. Skipping...`);
                } else if (array.includes(key)) {
                    console.log("Found a duplicate object. Skipping...");
                } else {
                    array.push(key);
                    port.postMessage({
                        type: type,
                        key: key,
                        userId: data.pubKey
                    });
                }
            }
        });
    }


    function calculatePageScore(numLikes, numDislikes) {
        let score = numLikes + numDislikes;
        score = (numLikes / score) * 100;
        score = Math.round(score);
        if (isNaN(score) || score === undefined) {
            return 0;
        } else {
            return score;
        }
    }

    async function getProfilePicture(pageUrl) {
        return new Promise(resolve => {
            user.get('profile').get(user.is.pub).get('photo').once(function (photo) {
                resolve(photo);
            });
        });
    }

    async function getName() {
        return new Promise(resolve => {
            user.get('profile').get(user.is.pub).get('name').once(function (name) {
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
        "id": "Make profile picture"
    });
});

chrome.runtime.onInstalled.addListener(function () {
    var title = "Add photo to gallery";
    var context = "image";
    var id = chrome.contextMenus.create({
        "title": title,
        "contexts": [context],
        "id": "Add photo to gallery"
    });
});

chrome.runtime.onInstalled.addListener(function () {
    var title = "Like Image";
    var context = "image";
    var id = chrome.contextMenus.create({
        "title": title,
        "contexts": [context],
        "id": "Like Image"
    });
});

chrome.runtime.onInstalled.addListener(function () {
    var title = "Dislike Image";
    var context = "image";
    var id = chrome.contextMenus.create({
        "title": title,
        "contexts": [context],
        "id": "Dislike Image"
    });
});

chrome.runtime.onInstalled.addListener(function () {
    var title = "Share Image";
    var context = "image";
    var id = chrome.contextMenus.create({
        "title": title,
        "contexts": [context],
        "id": "Share Image"
    });
});

chrome.contextMenus.onClicked.addListener(onClickHandler);

function onClickHandler(info, tab) {
    console.log(info);
    if (window.confirm(`Are you sure you want to ${info.menuItemId} (${info.srcUrl})`)) {
         user.get('profile').get(user.is.pub).get('photo').put(info.srcUrl);
    }
}

/***** Internal API for login and registration *****/

chrome.runtime.onConnect.addListener(function (port) {
    console.assert(port.name == "dvo"); // Do i need this? 
    port.onMessage.addListener(async function (request) {

        if (request.type === "isUserLoggedIn") {
            if (user.is) {
                port.postMessage({
                    type: "loggedIn",
                    response: true,
                    photo: "/images/profilepic.jpg"
                });
            } else {
                port.postMessage({
                    type: "loggedIn",
                    response: false
                });
            }
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "register") {
            user.create(request.username, request.password, function () {
                user.auth(request.username, request.password, function () {
                    port.postMessage({
                        response: true,
                        userId: user.is.pub
                    });
                    user.get('profile').get(user.is.pub).get('name').put("Guest User");
                    user.get('profile').get(user.is.pub).get('photo').put("images/profilepic.jpg");
                    user.get('profile').get(user.is.pub).get('email').put("guestuser123@gmail.com");
                    user.get('profile').get(user.is.pub).get('location').put("Devon, UK");
                    user.get('profile').get(user.is.pub).get('resume').put(null);
                });
            });
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "login") {
            user.auth(request.username, request.password, function () {
                port.postMessage({
                    response: true
                });
            });
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "logout") {
            user.leave();
        }
    });
});

/****************************** old/unused functions **************************************/

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
