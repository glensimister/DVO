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
                alert("You need to login to use DVO (top right)");
            }
            return true;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "getComments") {
            (async function () {
                let page = user.get('pageReviews').get(request.pageUrl);
                let comments = await getComments();
                let json = JSON.stringify(comments);
                let len = comments.length;

                port.postMessage({
                    type: "pageComments",
                    comments: json,
                    count: len
                });

                async function getComments() {
                    let array = [];
                    let keys = [];
                    let obj = {};
                    await page.get('comments').map().once(async function (data, key) {
                        if (data) { // What is this checking? 
                            if (keys.includes(key)) {
                                console.log("duplicate data. skipping...");
                            } else {
                                let commentReactions = await getCommentReactions(key);
                                console.log(commentReactions);
                                obj = {
                                    key: key,
                                    comment: data.comment,
                                    date: data.date,
                                    photo: data.photo,
                                    name: data.name,
                                    likes: commentReactions.likes,
                                    dislikes: commentReactions.dislikes,
                                    score: commentReactions.score
                                }
                                keys.push(key);
                                array.push(obj);
                            }
                        }
                    });
                    return array;
                }

                async function getCommentReactions(key) {
                    let obj = {
                        likes: 5,
                        dislikes: 2,
                        score: 3
                    }
                    return obj;
                }


                return true;
            })();
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "addComment") {
            if (window.confirm(`Confirm add comment`)) {
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
        else if (request.type === "getProfilePicture") { //is this still being used? 
            let photo = await getProfilePicture();
            port.postMessage({
                type: "photo",
                photo: photo
            });
            return true;
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////// 
        else if (request.type === "deleteComment") {
            if (window.confirm(`Confirm delete comment`)) {
                user.get('pageReviews').get(request.pageUrl).get('comments').get(request.commentId).put(null);
            }
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////// 
        else if (request.type === "updateComment") {
            if (window.confirm(`Confirm edit comment`)) {
                user.get('pageReviews').get(request.pageUrl).get('comments').get(request.commentId).get('comment').put(request.update);
            }
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////// 
        else if (request.type === "reaction") {
            (async function () {
                console.log(`**********************************************************`);
                console.log(`USER HAS REACTED! Type = ${request.reactType}`);
                console.log(`**********************************************************`);

                let likesGraphIsEmpty = await isEmpty(request.table, request.pageUrl, 'likes');
                let dislikesGraphIsEmpty = await isEmpty(request.table, request.pageUrl, 'dislikes');
                let page = user.get(request.table).get(request.pageUrl);
                let userId = user.is.pub;
                let hasLiked = false;
                let hasDisliked = false;
                let hasLikedKey = null;
                let hasDislikedKey = null;
                let likes = 0;
                let dislikes = 0;

                if (!likesGraphIsEmpty) {
                    let liked = await reactedAlready(request.table, request.pageUrl, request.itemId, 'likes');
                    hasLiked = liked.reactedAlready;
                    hasLikedKey = liked.key;
                    console.log(`User has liked this page already: ${hasLiked}`);
                }

                if (!dislikesGraphIsEmpty) {
                    let disliked = await reactedAlready(request.table, request.pageUrl, request.itemId, 'dislikes');
                    hasDisliked = disliked.reactedAlready;
                    hasDislikedKey = disliked.key;
                    console.log(`User has liked this page already: ${hasDisliked}`);
                }


                if (request.reactType === 'likes') {
                    if (hasLiked) {
                        console.log(`Revoking page like`);
                        await page.get(request.reactType).get(hasLikedKey).get('reacted').put(false);
                    } else {
                        console.log(`Liking ${request.itemId}`);
                        await page.get(request.reactType).set({
                            userId: userId,
                            reacted: true,
                            itemId: request.itemId
                        });
                        /*
                        This is firing multiple times even if only one object was set
                        page.get(request.reactType).map().once(function (data, key) {
                            console.log("data has been added with key: " + key);
                        });*/
                    }
                    if (hasDisliked) {
                        console.log(`Revoking page dislike`);
                        await page.get('dislikes').get(hasDislikedKey).get('reacted').put(false);
                    }
                }

                if (request.reactType === 'dislikes') {
                    if (hasDisliked) {
                        console.log(`Revoking page dislike`);
                        await page.get(request.reactType).get(hasDislikedKey).get('reacted').put(false);
                    } else {
                        console.log(`Disliking ${request.itemId}`);
                        await page.get(request.reactType).set({
                            userId: userId,
                            reacted: true,
                            itemId: request.itemId
                        });
                    }
                    if (hasLiked) {
                        console.log(`Revoking page like`);
                        await page.get('likes').get(hasLikedKey).get('reacted').put(false);
                    }
                }

                console.log("Refreshing scores...");
                getNumPageLikes(request.table, request.pageUrl, request.itemId);
                return true;
            })();
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////  
        else if (request.type === "getNumPageLikes") {
            getNumPageLikes(request.table, request.pageUrl, request.itemId);
            return true;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        else if (request.type === "getAll") {
            getAll(request.pageUrl, request.reactType);
            return true;
        }
    });
    ////////////////////////////////////////////////////////////////////////////////////////////////////


    /********** Helper functions **********/

    function getAll(pageUrl, type) {
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
                        userId: data.userId
                    });
                }
            }
        });
    }

    async function getNumPageLikes(table, pageUrl, itemId) {
        console.log(`GETTING PAGE REACTIONS...`);

        let likesGraphIsEmpty = await isEmpty(table, pageUrl, 'likes');
        let dislikesGraphIsEmpty = await isEmpty(table, pageUrl, 'dislikes');
        let likes = 0;
        let dislikes = 0;
        let hasLiked = false;
        let hasDisliked = false;

        if (!likesGraphIsEmpty) {
            likes = await countLikes(table, pageUrl, 'likes');
            hasLiked = await reactedAlready(table, pageUrl, itemId, 'likes');
            hasLiked = hasLiked.reactedAlready;
        }

        if (!dislikesGraphIsEmpty) {
            dislikes = await countLikes(table, pageUrl, 'dislikes');
            hasDisliked = await reactedAlready(table, pageUrl, itemId, 'dislikes');
            hasDisliked = hasDisliked.reactedAlready;
        }
        
        console.log("Likes: " + likes);
        console.log("Dislikes: " + dislikes);

        let score = calculatePageScore(likes, dislikes);
        port.postMessage({
            type: table,
            likes: likes,
            dislikes: dislikes,
            pageScore: score,
            hasLiked: hasLiked,
            hasDisliked: hasDisliked
        });
    }

    async function isEmpty(table, pageUrl, type) {
        let isEmpty;
        await user.get(table).get(pageUrl).get(type).once(function (data) {
            if (data === undefined) {
                isEmpty = true;
            } else {
                isEmpty = false;
            }
        });
        return isEmpty;
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

    async function countLikes(table, pageUrl, type) {
        let array = [];
        let userIdArray = [];
        let count = 0;
        console.log(`COUNTING ${type}...`);

        await user.get(table).get(pageUrl).get(type).map().once(function (res, key) {
            if (res.reacted === false) {
                console.log(`User has not reacted. Skipping...`);
            } else if (array.includes(key)) {
                console.log(`Found a duplicate object. Skipping...`);
            } else if (userIdArray.includes(res.userId)) {
                console.log(`Object has the same userID. Skipping...`);
            } else {
                array.push(key);
                userIdArray.push(res.userId);
                count++;
            }
        });
        return count;
    }

    async function reactedAlready(table, pageUrl, itemId, type) {
        let array = [];
        let userIdArray = [];
        let obj = {
            reactedAlready: false,
            key: null
        };

        console.log(`CHECKING FOR EXISTING ${type}...`);

        await user.get(table).get(pageUrl).get(type).map().once(function (data, key) {
            if (data !== null) { //what is this checking? 

                let userId = data.userId;
                let keyFound = array.includes(key);
                let userIdFound = userIdArray.includes(data.userId);

                console.log(`${type}: UserID: ${userId.substr(0, 10)}(...) has already reacted ${data.reacted} to ItemId: ${data.itemId}`);

                if (keyFound) {
                    console.log(`Found a duplicate key. Skipping...`);
                } else if (userIdFound) {
                    console.log(`Found a duplicate userId. Skipping...`);
                } else if (data.userId === user.is.pub && data.reacted && data.itemId === itemId) {
                    array.push(key);
                    userIdArray.push(data.userId);
                    obj = {
                        reactedAlready: true,
                        key: key
                    }
                } else {
                    obj = {
                        reactedAlready: false,
                        key: key
                    }
                }
            }
        });
        console.log(`Returning ${obj.reactedAlready}...`);
        return obj;
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

chrome.runtime.onInstalled.addListener(function () {
    var title = "Like Image";
    var context = "image";
    var id = chrome.contextMenus.create({
        "title": title,
        "contexts": [context],
        "id": "context" + 2
    });
});

chrome.runtime.onInstalled.addListener(function () {
    var title = "Dislike Image";
    var context = "image";
    var id = chrome.contextMenus.create({
        "title": title,
        "contexts": [context],
        "id": "context" + 3
    });
});

chrome.runtime.onInstalled.addListener(function () {
    var title = "Share Image";
    var context = "image";
    var id = chrome.contextMenus.create({
        "title": title,
        "contexts": [context],
        "id": "context" + 4
    });
});

chrome.contextMenus.onClicked.addListener(onClickHandler);

function onClickHandler(info, tab) {
    //if (window.confirm(`Are you sure you want to post ${info.srcUrl} to your DVO newsfeed?`)) {}
    user.get('profile').get('photo').put(info.srcUrl);
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
                        photo: "/images/profilepic.jpg"
                    });
                    user.get('profile').get('name').put(request.name);
                    let profilePicUrl = "https://glensimister.files.wordpress.com/2014/12/profilepic.jpg?w=660";
                    user.get('profile').get('photo').put(profilePicUrl);
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
