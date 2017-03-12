// 10XQC JavaScript - Plot Stuff

$(function() {
  // Listeners
  $('#plot_umi_barcodes_btn').click(function(e){
    e.preventDefault();
    plot_umi_barcodes();
  });
});

function plot_umi_barcodes(){

  // Reset and show the modal
  $('#plot_modal_plotdiv_wrapper').empty().html('<div id="plot_modal_plotdiv"><p class="text-muted text-center">Loading..</p></div>');
  $('#plot_modal_cat_label').text('Hover Information:');
  $('#plot_modal_cat_1').show();
  $('#plot_modal_cat_2').hide();
  $('#plot_modal_cat_1 option').attr('selected', false);
  $('#plot_modal').modal('show');

  // Get the hashes of the reports to plot
  samples = [];
  $('#sample_browse_table tbody tr').each(function(){
    samples.push($(this).attr('id'));
  });

  // Find which column is sorted
  var sorted_col_idx = $('#sample_browse_table').dataTable().fnSettings().aaSorting[0][0];
  var sort_col = $('#table_columns_modal_table input:checked').eq(parseInt(sorted_col_idx)).attr('name');
  $('#plot_modal_cat_1 option[value="'+sort_col+'"]').attr('selected', true);

  // Load the data
  var postdata = {
    'name_col': sort_col,
    'samples': samples
  }
  // $.post('api/umi_barcode_plotdata.json', postdata).done(function(ajax_data) { //TESTING
  $.getJSON('api/umi_barcode_plotdata.json', function(ajax_data) {
    $('#plot_modal_plotdiv').empty();
    pdata = [];
    $.each(ajax_data['data'], function(idx, data){
      pdata.push( {
        name: data[0],
        x: data[1][0],
        y: data[1][1],
        mode: 'lines',
        type: 'scattergl',
        hoverinfo: 'name',
        line: {
          width: 3
        }
      });
    });
    // Make the plot
    var layout = {
      title:'UMI Counts vs Barcode',
      height: 500,
      width: 500,
      hovermode: 'closest',
      xaxis: {
        title: 'Barcodes',
        type: 'log'
      },
      yaxis: {
        title: 'UMI Counts',
        type: 'log'
      }
    };
    var config = {
      displaylogo: false,
      showlink: false,
      modeBarButtonsToRemove: [
        "zoom2d",
        "pan2d",
        "zoomIn2d",
        "zoomOut2d",
        "autoScale2d",
        "toImage",
        "sendDataToCloud"
      ]
    };
    Plotly.newPlot('plot_modal_plotdiv', pdata, layout, config);
  });
}