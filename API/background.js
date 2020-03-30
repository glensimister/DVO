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

                // why do i need setTimeout? should put this inside the function
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
                            if (data) { // What is this checking? 
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
        else if (request.type === "addComment") {
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
            user.get('pageReviews').get(request.pageUrl).get('comments').get(request.commentId).put(null);
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////// 
        else if (request.type === "updateComment") {
            user.get('pageReviews').get(request.pageUrl).get('comments').get(request.commentId).get('comment').put(request.update);
        }
        //////////////////////////////////////////////////////////////////////////////////////////////////// 
        else if (request.type === "reaction") {
            (async function () {

                console.log("USER HAS REACTED!");

                let likesGraphIsEmpty = await isEmpty(request.pageUrl, 'likes');
                let dislikesGraphIsEmpty = await isEmpty(request.pageUrl, 'dislikes');

                let hasLiked = false;
                let hasDisliked = false;
                let hasLikedKey = null;
                let hasDislikedKey = null;
                let likes = 0;
                let dislikes = 0;

                if (!likesGraphIsEmpty) {
                    let liked = await reactedAlready(request.pageUrl, 'likes');
                    hasLiked = liked.reacted;
                    hasLikedKey = liked.key;
                    console.log("Has the user liked this page already? " + hasLiked);
                }

                if (!dislikesGraphIsEmpty) {
                    let disliked = await reactedAlready(request.pageUrl, 'dislikes');
                    hasDisliked = disliked.reacted;
                    hasDislikedKey = disliked.key;
                    console.log("Has the user disliked this page already? " + hasDisliked);
                }

                let page = user.get('pageReviews').get(request.pageUrl);
                let id = user.is.pub;


                if (request.reactType === 'likes') {
                    if (hasLiked) {
                        console.log("Deleting: " + hasLikedKey);
                        page.get(request.reactType).get(hasLikedKey).get('userId').put(null);
                    } else {
                        console.log("Liking...");
                        page.get(request.reactType).set({
                            userId: id
                        });
                        /*
                        This is firing multiple times even if only one object was set
                        page.get(request.reactType).map().once(function (data, key) {
                            console.log("data has been added with key: " + key);
                        });*/
                    }
                    if (hasDisliked) {
                        console.log("Deleting: " + hasDislikedKey);
                        page.get(request.reactType).get(hasDislikedKey).get('userId').put(null);
                    }
                }

                if (request.reactType === 'dislikes') {
                    if (hasDisliked) {
                        console.log("Deleting: " + hasDislikedKey);
                        page.get(request.reactType).get(hasDislikedKey).get('userId').put(null);
                    } else {
                        console.log("Disliking...");
                        page.get(request.reactType).set({
                            userId: id
                        });
                    }
                    if (hasLiked) {
                        console.log("Deleting: " + hasLikedKey);
                        page.get(request.reactType).get(hasLikedKey).get('userId').put(null);
                    }
                }

                console.log("Refreshing scores...");
                getNumPageLikes(request.pageUrl);
                return true;
            })();
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////  
        else if (request.type === "getNumPageLikes") {
            getNumPageLikes(request.pageUrl);
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

    async function getNumPageLikes(pageUrl) {

        let likesGraphIsEmpty = await isEmpty(pageUrl, 'likes');
        let dislikesGraphIsEmpty = await isEmpty(pageUrl, 'dislikes');
        let likes = 0;
        let dislikes = 0;
        let hasLiked = false;
        let hasDisliked = false;

        if (!likesGraphIsEmpty) {
            likes = await countLikes(pageUrl, 'likes');
            console.log("Likes: " + likes);
            hasLiked = await reactedAlready(pageUrl, 'likes');
            hasLiked = hasLiked.reacted;
        }

        if (!dislikesGraphIsEmpty) {
            dislikes = await countLikes(pageUrl, 'dislikes');
            console.log("Dislikes: " + dislikes);
            hasDisliked = await reactedAlready(pageUrl, 'dislikes');
            hasDisliked = hasDisliked.reacted;
        }

        console.log("Likes: " + likes);
        console.log("Dislikes: " + dislikes);
        console.log("********************************************************");

        let score = calculatePageScore(likes, dislikes);
        port.postMessage({
            type: "pageLikes",
            likes: likes,
            dislikes: dislikes,
            pageScore: score,
            hasLiked: hasLiked,
            hasDisliked: hasDisliked
        });
    }

    async function isEmpty(pageUrl, type) {
        let isEmpty;
        await user.get('pageReviews').get(pageUrl).get(type).once(function (data) {
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

    async function countLikes(pageUrl, type) {
        let array = [];
        let userIdArray = [];
        let count = 0;

        await user.get('pageReviews').get(pageUrl).get(type).map().once(function (res, key) {
            if (res.userId === null) {
                console.log(`Found a ${res.userId} object. Skipping...`);
            } else if (array.includes(key)) {
                console.log("Found a duplicate object. Skipping...");
            } else if (userIdArray.includes(res.userId)) {
                console.log("Object has the same userID. Skipping...");
            } else {
                array.push(key);
                userIdArray.push(res.userId);
                count++;
            }
        });
        return count;
    }

    async function reactedAlready(pageUrl, type) {
        let obj = {
            reacted: false,
            key: null
        }
        await user.get('pageReviews').get(pageUrl).get(type).map().once(function (data, key) {
            if (data !== null) {
                if (data.userId === user.is.pub) {
                    obj = {
                        reacted: true,
                        key: key
                    }
                }
            }
        });
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

chrome.contextMenus.onClicked.addListener(onClickHandler);

function onClickHandler(info, tab) {
    //if (window.confirm(`Are you sure you want to post ${info.srcUrl} to your DVO newsfeed?`)) {}
    user.get('profile').get('photo').put(info.srcUrl);
}

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

/*async function isEmpty(pageUrl, type) {
    return new Promise(resolve => {
        setTimeout(() => {
            user.get('pageReviews').get(pageUrl).get(type).once(function (data) {
                if (data === undefined || data === null) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        }, 100);
    });
}*/

/*async function countLikes(pageUrl, type) {
    let array = [];
    let count = 0;
    return new Promise(resolve => {
        setTimeout(async() => {
            await user.get('pageReviews').get(pageUrl).get(type).map().once(function (res, key) {
                if (res.userId === null) {
                    console.log(`Found a ${res.userId} object. Skipping...`);
                } else if (array.includes(key)) {
                    console.log("Found a duplicate object. Skipping...");
                } else {
                    console.log("Found userID: " + res.userId);
                    array.push(key);
                    count++;
                    console.log("Reaction count: " + count);
                }
            });
            resolve(count);
        }, 100);
    });
}*/

/*async function reactedAlready(pageUrl, type) {
    let obj = {
        reacted: false,
        key: null
    }
    return new Promise(resolve => {
        setTimeout(() => {
            user.get('pageReviews').get(pageUrl).get(type).map().once(function (data, key) {
                if (data !== null) {
                    if (data.userId === user.is.pub) {
                        obj = {
                            reacted: true,
                            key: key
                        }
                    }
                }
                resolve(obj);
            });
        }, 100);
    });
}*/
