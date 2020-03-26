$(document).ready(async function () {
    window.webId = "glensimister.github.com/profile";
    window.name = "Glen Simister";
    window.photo = "img/profilepic.jpg";

    //$('.select2').select2();

    let userExists = await gun.get('users').get('webId');
    if (userExists !== null) {
        API_createUser();
    }

    function splitPageString(page) {
        let res = page.split("-");
        if (res[1])
            return res[0] + " " + res[1];
        else return page;
    }


    var app = $.sammy(function () {
        this.get('#/', function () {
            $("#main").load("pages/home/index.html");
            $(".breadcrumbs").hide();
        });
        this.get('/index.html', function () {
            $("#main").load("pages/home/index.html");
            $(".breadcrumbs").hide();
        });
        this.get('/', function () {
            $("#main").load("pages/home/index.html");
            $(".breadcrumbs").hide();
        });
        this.get('#/:page', function () {
            let page = `pages/${this.params['page']}.html`;
            $("#main").load(page);
            $(".breadcrumbs").hide();
        });
        /******* most pages use this routing ******/
        this.get('#/:folder/:page', function () {
            let folder = this.params['folder'];
            let page = this.params['page'];
            let pageUrl = `pages/${folder}/${page}.html`;
            let menuItem = `a[href="#/${folder}/${page}"]`;
            $("#main").load(pageUrl);
            $(".breadcrumbs").hide();
        });
        this.get('#/:folder/:subfolder/:page', function () {
            let folder = this.params['folder'];
            let subfolder = this.params['subfolder'];
            var page = this.params['page'];
            let pageUrl = `pages/${folder}/${subfolder}/${page}.html`;
            let menuItem = `a[href="#/${folder}/${page}"]`;
            $("#main").load(pageUrl);

            //breadcrumbs
            let backButton = `<div class="back" onclick="history.back()"><i class="fa fa-caret-left"></i><span>Back</span>|<span>${splitPageString(page)}</span></div>`;
            $(".breadcrumbs").show();
            $(".breadcrumbs").html(backButton);
        });
    });

    $(function () {
        app.run()
    });

});
