class PostCategories extends HTMLElement {
  connectedCallback() {      
    this.innerHTML = `
<style>
post-categories select {
    border: none;
    border-radius: 4px;
    height: 100%;
    margin-bottom:20px;
    width: 100%;
    background-color: #1c2529;
    color: #fff;
    font-size: 14px;
    padding:10px;
}

</style>

                        <select>
                            <option>-- All Categories --</option>
                            <option>Anouncements</option>
                            <option>Ideas</option>
                            <option>Devolution</option>
                            <option>Close friends</option>
                            <option>Politics</option>
                            <option>News</option>
                            <option>Other</option>
                        </select>`;
  }
}
    
customElements.define('post-categories', PostCategories);          



