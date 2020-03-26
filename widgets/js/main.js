    $(document).ready(function(){
        $('#btn-add-new').click(function(){
            $('#add-new').show();
            $('#your-widgets').hide();
        });
        $('#btn-your-widgets').click(function(){
            $('#your-widgets').show();
            $('#add-new').hide();
        });
        
        $('#get-link').click(function(){
            $('#add-new').html(`<input type="text" class="form-control" value="http://donateSocialCredits@dvo.dvo/?pubKey=0x66454C561Cf137F53321945758b0E4645E9EEae8&amp;postId=54518&amp;target=5000&amp;days=100" />`);
        });
    });

