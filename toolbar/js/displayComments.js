$(document).ready(async function () {

    let laserExtensionId = "bnmeokbnbegjnbddihbidleappfkiimj";
    let port = chrome.runtime.connect(laserExtensionId);
    let url = await getPageUrl();

    getComments();

    $(".post-comment-btn").on('click', function (e) {
        e.stopImmediatePropagation();
        let id = Math.random().toString(36).slice(-6);
        //url = `${url}?=${id}`;
        let newComment = $(".post-comment").val();
        port.postMessage({
            type: "addComment",
            commentId: id,
            pageUrl: url,
            comment: newComment,
            date: getDate()
        });
        getComments();
    });

    function getComments() {
        port.postMessage({
            type: "getComments",
            pageUrl: url
        });
        port.onMessage.addListener(function (res) {
            if (res.type == "pageComments") {
                let json = JSON.parse(res.comments);

                if (json.length > 0) {
                    $("#dialogBody").html("");
                }

                let likeClass = 'red';
                let dislikeClass = 'blue';

                json.forEach(async function (item, index) {

                    let template = `<div id="${item.key}" class="post">
<i class="edit-post fa fa-edit"></i>
<i class="delete-post fa fa-close"></i>
<div class="post-body">
<img src="${item.photo}" class="user-image-medium" alt="User Image">
<span><a href="#">${item.name}</a><span class="date">${item.date}</span></span>
<div class="post-desc">
<p>${item.comment}</p>
</div>
</div>
<div class="toolbar-comments">
<div class="like"><i class="${likeClass} fa fa-thumbs-up"></i></div>
<div class="like-count">${item.likes}</div>
<div class="dislike"><i class="${dislikeClass} fa fa-thumbs-down"></i></div>
<div class="dislike-count">${item.dislikes}</div>
<div class="score"><x-star-rating value="${item.score}" number="5"></x-star-rating></div>
</div>
</div>
`;


                    let postDesc = document.querySelector(".post-desc"); // this could be jquery to make it more consistent

                    $("#dialogBody").append(template);
                    $('#comments').html(res.count);
                });


                $('.delete-post').on("click", function () {
                    let commentId = $(this).parent().attr('id');
                    let _this = this;
                    port.postMessage({
                        type: "deleteComment",
                        commentId: commentId,
                        pageUrl: url
                    });
                    port.onMessage.addListener(function (res) {
                        if (res.type === "commentDeleted") {
                            $(_this).parent().remove();
                        }
                    });

                });

                $('.edit-post').on("click", function () {
                    let currentText = $(".post-desc").html();
                    if ($(this).hasClass('fa-edit')) {
                        $(".post-desc").attr("contenteditable", "true");
                        $(".post-desc").addClass('editable');
                    } else if ($(this).hasClass('fa-save')) {
                        let newText = $(".post-desc").html();
                        $(".post-desc").attr("contenteditable", "false");
                        $(".post-desc").removeClass('editable');
                        //if (newText !== currentText) { //maybe need to use string compare
                        let commentId = $(this).parent().attr('id');
                        port.postMessage({
                            type: "updateComment",
                            update: newText,
                            commentId: commentId,
                            pageUrl: url
                        });
                        //}
                    }
                    $(this).toggleClass("fa-edit fa-save");
                });

                $(".like").on('click', function () {
                    let commentId = $(this).parent().parent().attr('id');
                    port.postMessage({
                        type: "likeComment",
                        pageUrl: url,
                        commentId: commentId
                    });

                    //likeComment('likes', commentId);
                    $(this).find('i').toggleClass("red gray");
                });
                $(".dislike").on('click', function () {
                    let commentId = $(this).parent().parent().attr('id');
                    likeComment('dislikes', commentId);
                    $(this).find('i').toggleClass("blue gray");
                });

                function likeComment(reactType, id) {
                    port.postMessage({
                        type: "reaction",
                        table: "pageReviews",
                        reactType: reactType,
                        pageUrl: url,
                        itemId: id,
                        date: getDate()
                    });
                    port.onMessage.addListener(function (res) {
                        if (res.type === "pageReviews") {
                            $(`#${id} .like-count`).html(res.likes);
                            $(`#${id} .dislike-count`).html(res.dislikes);

                            // better to set this with jquery
                            let score = `<x-star-rating value="${res.pageScore}" number="5"></x-star-rating>`;
                            $(`#${id} .score`).html(score);
                        }
                    });
                }
            }
        });
    }
});

///////////////////////////// functions /////////////////////////////////////


async function getPageUrl() {
    return new Promise(resolve => {
        chrome.tabs.query({
            'active': true,
            'lastFocusedWindow': true
        }, function (tabs) {
            resolve(tabs[0].url);
        });
    });
}

function getDate() {
    var d = new Date();
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let day = d.getDate();
    let month = monthNames[d.getMonth()];
    let year = d.getFullYear();
    let date = `${day} ${month}, ${year}`;
    return date;
}
