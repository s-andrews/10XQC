// 10XQC JavaScript - Plot stuff on homepage

// API URLs
plot_api = '10xqc.cgi?action=rankdata&';

// Testing API URLs
// plot_api = 'test/plot_cgi.json?';

$(function() {
  // Listeners
  $('#plot_umi_barcodes_btn').click(function(e){
    e.preventDefault();
    plot_umi_barcodes();
  });
  $('#plot_metadata_btn').click(function(e){
    e.preventDefault();
    plot_metadata();
  });
});

function plot_umi_barcodes(){

  // Reset and show the modal
  $('#umi_plot_modal_plotdiv_wrapper').empty().html('<div id="umi_plot_modal_plotdiv"><p class="text-muted text-center">Loading..</p></div>');
  $('#umi_plot_modal_cat_label').text('Hover Information:');
  $('#umi_plot_modal_cat_1').show();
  $('#umi_plot_modal_cat_2').hide();
  $('#umi_plot_modal_cat_1 option').attr('selected', false);
  $('#umi_plot_modal').modal('show');

  // Get the hashes of the reports to plot
  samples = [];
  $('#sample_browse_table tbody tr').each(function(){
    samples.push( $(this).attr('id').replace('row_', '') );
  });

  // Find which column is sorted
  var sorted_col_idx = $('#sample_browse_table').dataTable().fnSettings().aaSorting[0][0];
  var sort_col = $('#table_columns_modal_table input:checked').eq(parseInt(sorted_col_idx)).attr('name');
  $('#umi_plot_modal_cat_1 option[value="'+sort_col+'"]').attr('selected', true);

  // Load the data
  var api_url = plot_api+'ids='+samples.join(',');
  console.log(api_url);
  $.getJSON(api_url, function(ajax_data) {
    $('#umi_plot_modal_plotdiv').empty();
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
    Plotly.newPlot('umi_plot_modal_plotdiv', pdata, layout, config);
  });
}



function plot_metadata(){
  // Reset and show the modal
  $('#table_plot_modal_plotdiv_wrapper').empty().html('<div id="umi_plot_modal_plotdiv"><p class="text-muted text-center">Select columns to compare</p></div>');
  $('#table_plot_modal').modal('show');
}