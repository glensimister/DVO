$(document).ready(async function () {

    let laserExtensionId = "bnmeokbnbegjnbddihbidleappfkiimj";
    let port = chrome.runtime.connect(laserExtensionId);
    
    /*
    chrome.tabs.query() was returning the popup url and not the page url 
    so i passed the url as parameter from background.js
    }*/
    
    var urlParams = new URLSearchParams(window.location.search);
    console.log(urlParams.get('url'));
    let url = urlParams.get('url');
    
    getComments();

    $(".post-comment-btn").on('click', function (e) {
        e.stopImmediatePropagation();
        let id = Math.random().toString(36).slice(-6);
        let newComment = $(".post-comment").val();
        port.postMessage({
            type: "addComment",
            commentId: id,
            pageUrl: url,
            comment: newComment,
            date: getDate()
        });
        port.onMessage.addListener(function (res) {
            if (res.type === "commentAdded") {
                getComments();
            }
        });
    });

    function getComments() {
        $("#dialogBody").empty();
        $("#dialogBody").prepend(`<img style="display:block; width: 128px; margin:20px auto;" src="../images/widget-loader.gif" />`);
        port.postMessage({
            type: "getComments",
            pageUrl: url
        });
        port.onMessage.addListener(function (res) {
            if (res.type === "pageComments") {
                let json = JSON.parse(res.comments);
                console.log(json);
                if (json === null || json.length == 0) {
                    $("#dialogBody").html(`<p style="text-align: center">There are no comments to show</p>`);
                } else {
                    $("#dialogBody").empty();
                }

                json.sort((a, b) => (a.score > b.score) ? 1 : (a.score === b.score) ? ((a.likes > b.likes) ? 1 : -1) : -1);
                let likeClass = 'red';
                let dislikeClass = 'blue';

                json.forEach(function (item, index) {
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
<div class="toolbar">
<div class="like"><i class="${likeClass} fa fa-thumbs-up"></i></div>
<div class="like-count">${item.likes}</div>
<div class="dislike"><i class="${dislikeClass} fa fa-thumbs-down"></i></div>
<div class="dislike-count">${item.dislikes}</div>
<div class="score"><x-star-rating value="${item.score}" number="5"></x-star-rating></div>
</div>
</div>
`;
                    $("#dialogBody").prepend(template);
                });

                let postDesc = document.querySelector(".post-desc"); // this could be jquery to make it more consistent
                //$('#comments').html(res.count);

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
                            //$(_this).parent().remove();
                            getComments();
                        }
                    });

                });

                $('.edit-post').on("click", function () {
                    let commentId = $(this).parent().attr('id');
                    let currentText = $(`#${commentId} .post-desc`).html();
                    if ($(this).hasClass('fa-edit')) {
                        $(`#${commentId} .post-desc`).attr("contenteditable", "true");
                        $(`#${commentId} .post-desc`).addClass('editable');
                    } else if ($(this).hasClass('fa-save')) {
                        let newText = $(`#${commentId} .post-desc`).html();
                        $(`#${commentId} .post-desc`).attr("contenteditable", "false");
                        $(`#${commentId} .post-desc`).removeClass('editable');
                        //if (newText !== currentText) { // should cancel if strings match
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
                    likeComment('like', commentId);
                    $(this).find('i').toggleClass("red gray");
                });
                $(".dislike").on('click', function () {
                    let commentId = $(this).parent().parent().attr('id');
                    likeComment('dislike', commentId);
                    $(this).find('i').toggleClass("blue gray");
                });

                function likeComment(reactType, commentId) {
                    port.postMessage({
                        type: "likeComment",
                        reactType: reactType,
                        pageUrl: url,
                        commentId: commentId,
                        date: getDate()
                    });

                    port.onMessage.addListener(function (res) {
                        if (res.type === "getCommentLikes") {
                            $(`#${commentId} .like-count`).html(res.likes);
                            $(`#${commentId} .dislike-count`).html(res.dislikes);
                            $(`#${commentId} .score`).html(`<x-star-rating value="${(res.score/10)/2}" number="5"></x-star-rating>`);
                        }
                    });
                }
            }
        });
    }
});

///////////////////////////// functions /////////////////////////////////////


function getDate() {
    var d = new Date();
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let day = d.getDate();
    let month = monthNames[d.getMonth()];
    let year = d.getFullYear();
    let date = `${day} ${month}, ${year}`;
    return date;
}
