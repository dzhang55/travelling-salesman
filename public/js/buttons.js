var selection;

$('#submit').submit(function (e) {
    var form = $(this).serialize();
    $('#error-message').css('display', 'none');
    console.log(form);
    $.post('/solve', form + '&points=' + JSON.stringify(points), function (data) {
        if (data.err) {
            $('#error-message').css('display', 'block');
            $('#overlay').css('display', 'none');
            return;
        }
        clearLines(true);
        animate(data.paths, data.swaps, data.insertions, data.isClosed);
        updateDistanceDisplay(data.distances);
        initializeGraph(data.distances);
        $('#overlay').css('display', 'none');
    });
    $('#overlay').css('display', 'block');
    e.preventDefault();
});

$('#cooling-function .btn').on('click', function () {
    $('#cooling-function .btn').removeClass('selected');
});

$('#algorithmlist').on('click', 'a', function (e) {
    e.preventDefault();
    selection = $(this).html();
    $('#algorithm-input').val(selection);
    console.log(selection);
    var button = $('#algorithm');
    var children = button.children();
    button.html(selection + ' ');
    button.append(children);
    $('#options div').addClass('hidden');
    switch (selection) {
        case 'Hill Climber':
            $('#iterations').removeClass('hidden');
            break;
        case 'Simulated Annealing':
            $('#iterations').removeClass('hidden');
            $('#cooling-function').removeClass('hidden');
            break;
        case 'Genetic Algorithm':
            $('#iterations').removeClass('hidden');
            $('#population').removeClass('hidden');
            break;
        default:
            break;
    }
    $('#submission').removeClass('hidden');
});