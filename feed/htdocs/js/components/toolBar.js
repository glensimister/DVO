class ToolBar extends HTMLElement {
    async connectedCallback() {

        let thumbsUpBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAABYklEQVQokY2SsYoTYRSFv28YFgmLiJUsFsvYWEoQwcHWZqext7IQLcUXsPAJrK1sfAAhPkHIdoKVEMiwSKpUEsIiIeRYzG6UmKye5ue/9z/n3HP5DWEf2qY+CKkIizufT6fb/WIvs8Ndwnv1XdvUx9vN8ipm4L5YB34Y+sDZfzm3J/V1wzOkIFkhi+037so8aR4eCm/A1yEF+EV4GpiTnKvzajBal5OmvknSR0rjAvKd8AJ8CSlUIH3wm8kaHYY8B8alcA/8AJTIDPgkvgJ64OWAF4cF8EA8BsYl0EOOLhZUgLdMeijb6CI6hkx/LyyXC8if179gN8FcPN+QY+aEMxQS3OHaqQZhmmQGUKQrtMjHLpb7/5wuga/qT4BCnYPXIE8CLWQizIBFNjE2cgtgWA1G6y7mDp/2pD6KPII8NtxGD4FVYCh5Ww1Ol3vJG5GmPgBukPSiK2FWDUbLTYqryP/CLycdkbNyK7wcAAAAAElFTkSuQmCC';
        let thumbsDownBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAABJElEQVQokaWTsUoDURBFzw0hpFhCKr8gCIloYWUhFhYW1iv+hNj4AZbiH9gI6ROstBCClV8QggvBRrCyCCIBrfZarCaPzTOCDgxTvDncO8M8GfPXqC57VC9LECtFnydYEx+08xmsflYF10GA86KyijlEbMI3rBfwGTAIlfeBS+ADNAUPgCOkiBW9hnAFqIEesa+ABijBArOYsKt+loQwwBbS8Vzhh4Qm0CrDX2Hwr9vfCGcO2Mic5TBrAewx5gJUQzyBx6Bt7BZS4SSsuD6bLnYk6j/sgG4wCSIHroER9jui67TzvGh7jt8DJ4hzTBMxxT5F5E47syOJKhfqWQO7h7QHjJy218s9lQhX7CVtvyHdgifAXaxn6W0DXcwQMYy6+8+v+gQW1WVtnBrREAAAAABJRU5ErkJggg==';

        this.innerHTML = `
<style>
.toolbar-comments {
    background: #1c2529;
    box-sizing: border-box;
    display: grid;
    grid-gap: 2px;
    grid-auto-flow: column;
    padding: 4px;
    width: 100%;
    font-size: 12px;
    font-family: sans-serif;
    text-align:center;
}
.toolbar-comments img {
    vertical-align: middle;
}
</style>

<div class="toolbar-comments">
<div id="like" class="red"><img src="${thumbsUpBase64}"/></div>
<div>12</div>
<div id="dislike" class="blue"><img src="${thumbsDownBase64}"/></div>
<div>2</div>
</div>`;
    }
}

customElements.define('tool-bar', ToolBar);