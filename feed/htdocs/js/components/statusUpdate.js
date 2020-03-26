class StatusUpdate extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
<style>
.grid-status {
    display: grid;
    text-align: center;
    grid-template-columns: 2fr 1fr;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    border: 1px solid #1c2529;
    /*border-left: 1px solid #eee;
    border-right: 1px solid #eee;
    border-bottom: 1px solid #eee;*/
    margin-bottom: 20px;
}
.grid-status > div {
    box-sizing: border-box;
}
.grid-status > div:nth-child(1) {
border-right: 1px solid #1c2529;
}
.grid-status select {
    border: none;
    height: 100%;
    width: 100%;
    color: #fff;
    font-size: 14px;
    padding:10px;
    background:transparent;
    background: #2c3a40;
    border-bottom-left-radius: 4px;
}

button.post-update {
    border: none;
    height: 100%;
    width: 100%;
    padding: 5px 20px;
    background: none;
    text-align: center;
    cursor: pointer;
    font-family: sans-serif;
    background: #2c3a40;
    border-bottom-right-radius: 4px;
}

button.post-update {
    color: #dd4b39;
}
status-update input {
    padding: 20px;
    font-size: 16px;
    width: 100%;
    border: none;
    background-color: #1c2529;
    color: #fff;
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
    -webkit-box-shadow: inset 0px 3px 5px 0px rgba(0, 0, 0, 0.57);
    -moz-box-shadow: inset 0px 3px 5px 0px rgba(0, 0, 0, 0.57);
    box-shadow: inset 0px 3px 5px 0px rgba(0, 0, 0, 0.57);
}
status-update input:focus {
    outline: 0;
}
status-update .select2-container--default .select2-selection--multiple {
    border-radius: 0px;
    border: none;
    padding: 5px;
    width: 100%;
    font-size: 14px;
    color: #fff;
background-color: #1c2529;
}
status-update .select2-container--default .select2-selection--multiple .select2-selection__choice {
    border-radius: 0;
}
.post-update button {
    display: block;
    line-height: 21px;
    width: 100%;
    border: none;
    background: none;
    text-align: center;
    color: #00acd6;
    cursor: pointer;
    font-family: sans-serif;
}
.post-update button:focus {
    outline: 0;
}

</style>
<input type="text" class="input-box" placeholder="What's on your mind, Glen?" />
                <div class="grid-status">
                    <div>
                        <select>
                            <option>Please select a category</option>
                            <option>Public anouncement</option>
                            <option>Idea</option>
                            <option>Devolution support</option>
                            <option>Close friends</option>
                            <option>Politics</option>
                            <option>News</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <button class="post-update">POST <i class="fa fa-fw fa-chevron-circle-right"></i></button>
                    </div>
                </div>`;
    }
}

customElements.define('status-update', StatusUpdate);
