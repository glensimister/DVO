$(document).ready(async function () {

    let laserExtensionId = "bnmeokbnbegjnbddihbidleappfkiimj";
    let port = chrome.runtime.connect(laserExtensionId);


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

    let url = await getPageUrl();
    //let url = window.location.toString();

    getComments();

    function getDate() {
        var d = new Date();
        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let day = d.getDate();
        let month = monthNames[d.getMonth()];
        let year = d.getFullYear();
        let date = `${day} ${month}, ${year}`;
        return date;
    }

    $(".post-comment-btn").on('click', function (e) {
        e.stopImmediatePropagation();
        let newComment = $(".post-comment").val();
        port.postMessage({
            type: "addComment",
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
                console.log(res.comments);
                //console.log(Object.values(res.comments));
                let json = JSON.parse(res.comments);

                let score = (12 / 2 * 10) / 2;
                $("#dialogBody").html("");
                json.forEach(function (item, index) {
                    console.log(item, index);
                    //score = Math.round(score);

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
<div id="like"><i class="like-comment red fa fa-thumbs-up"></i></div>
<div>12</div>
<div id="dislike"><i class="dislike-comment blue fa fa-thumbs-down"></i></div>
<div>2</div>
<div id="score" class="${score}"><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i></div>
</div>
</div>
`;
                    $("#dialogBody").append(template);
                    setTimeout(function () {
                        let score = $('#score').attr('class');
                        $('.fa-star').each(function (index) {
                            var num = (index + 1) % 5;
                            if (num <= score && num > 0)
                                $(this).addClass('yellow');
                        });
                    }, 500);

                    let comment = document.getElementById("comment");
                    let comments = document.querySelectorAll("#comments");
                    $('#comments').html(res.count);
                });

                //<x-star-rating value="${score}" number="5"></x-star-rating>

            }
        });
    }

    let postDesc = document.querySelector(".post-desc");

    $(document).on("click", '.delete-post', function () {
        let commentId = $(this).parent().attr('id');
        port.postMessage({
            type: "deleteComment",
            commentId: commentId,
            pageUrl: url
        });
        $(this).parent().remove();
    });

    $(document).on("click", '.edit-post', function () {
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

    $(".like-comment").on('click', function () {
        alert("LIKED");
    });
    $(".dislike-comment").on('click', function () {
        alert("DISLIKED");
    });
});
