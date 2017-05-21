$(function (){
    $("form").submit(function(e) {
        const ideas = {
            one: $('#one').val(),
            two: $('#two').val()
        };

        console.log(ideas);

        e.preventDefault();
        $.ajax({
            url: '/ponzi',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(ideas),
            dataType: 'text',
            success: function(idea) {
                //Remove the two text fields and submit button
                //Replace them with a field displaying recieved idea
            },
            error: function(xhr, ajaxOptions, thrownError) {
                alert('ERROR', xhr.responseText, thrownError);
            }
        });
    });
});