// 10XQC JavaScript - Plot stuff on homepage

// Global variables
pdata = [];

// API URLs
plot_api = '10xqc.cgi?action=rankdata&';

// // Testing API URLs
// plot_api = 'test/plot_cgi.json?';

$(function() {
  ///////////////////
  // LISTENERS

  // Buttons to launch plots
  $('#plot_umi_barcodes_btn').click(function(e){
    e.preventDefault();
    // Reset and show the modal
    Plotly.purge('umi_plot_modal_plotdiv');
    $('.umi_plot_modal_plotdiv_wrapper').empty();
    $('.umi_plot_modal_plotdiv_wrapper').html('<div id="umi_plot_modal_plotdiv"><div class="alert alert-info mt-5">Loading plot..</div></div>');
    $('#umi_plot_modal_cat_1').show();
    $('#umi_plot_modal_cat_1 option').attr('selected', false);
    $('#umi_plot_modal').modal('show');
    // Plot the barcodes when the modal is visible
    $('#umi_plot_modal').on('shown.bs.modal', function (e) {
      plot_umi_barcodes();
    });
  });
  $('#plot_metadata_btn').click(function(e){
    e.preventDefault();
    // Reset and show the modal
    Plotly.purge('table_plot_modal_plotdiv');
    $('#table_plot_modal_label option, #table_plot_modal_yaxis option, #table_plot_modal_xaxis option').attr('selected', false);
    $('.table_plot_modal_plotdiv_wrapper').empty().html('<div id="table_plot_modal_plotdiv" class="alert alert-info">Please select fields to compare</div>');
    // Find which column is sorted and set as default for label
    var sorted_col_idx = $('#sample_browse_table').dataTable().fnSettings().aaSorting[0][0];
    var sort_col = $('#table_columns_modal_table input:checked').eq(parseInt(sorted_col_idx)).attr('name');
    $('#table_plot_modal_label option[value="'+sort_col+'"]').attr('selected', true);
    // Show the modal and set up the plotting area
    $('#table_plot_modal').modal('show');
    $('#table_plot_modal').on('shown.bs.modal', function (e) {
      plot_metadata();
    });
  });

  // Plot select dropdowns
  $('#umi_plot_modal_cat_1').change(function(e){
    e.preventDefault();
    update_umi_plot_names();
  });
  $('#table_plot_modal_label, #table_plot_modal_yaxis, #table_plot_modal_xaxis').change(function(e){
    e.preventDefault();
    plot_metadata();
  });
});

function plot_umi_barcodes(){

  try {

    // Get the IDs of the reports to plot
    samples = [];
    $('#sample_browse_table tbody tr').each(function(){
      samples.push( $(this).attr('id').replace('row_', '') );
    });

    // Find which column is sorted
    var sorted_col_idx = $('#sample_browse_table').dataTable().fnSettings().aaSorting[0][0];
    var sort_col = $('#table_columns_modal_table input:checked').eq(parseInt(sorted_col_idx)).attr('name');
    $('#umi_plot_modal_cat_1 option[value="'+sort_col+'"]').attr('selected', true);

    // Get the default colours
    var colors = Plotly.d3.scale.category20();
    // List to hold unique names
    var names = [];

    // Load the data
    var api_url = plot_api+'ids='+samples.join(',');
    $.getJSON(api_url, function(ajax_data) {
      try {
        $('#umi_plot_modal_plotdiv').empty();
        pdata = [];
        $.each(ajax_data['data'], function(idx, data){
          name = '';
          for(i=0; i<t_data.length; i++){
            if(t_data[i]['DT_RowId'].replace('row_','') == data[0]){
              name = t_data[i][sort_col];
            }
          }
          if(names.indexOf(name) < 0){
            names.push(name);
          }
          var colour = colors(names.indexOf(name));
          pdata.push( {
            name: name,
            uid: data[0],
            x: data[1][0],
            y: data[1][1],
            mode: 'lines',
            type: 'scattergl',
            hoverinfo: 'name',
            line: {
              width: 3,
              color: colour
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
            // "zoom2d",
            // "pan2d",
            // "zoomIn2d",
            // "zoomOut2d",
            "autoScale2d",
            // "toImage",
            "sendDataToCloud"
          ]
        };
        Plotly.newPlot('umi_plot_modal_plotdiv', pdata, layout, config);
      } catch(e){
        $('.umi_plot_modal_plotdiv_wrapper').empty().html('<div id="umi_plot_modal_plotdiv"><div class="alert alert-danger mt-5"><strong>Error:</strong> Something went wrong when making the plot.</div></div>');
        console.error(e);
      }
    });
  } catch(e){
    $('.umi_plot_modal_plotdiv_wrapper').empty().html('<div id="umi_plot_modal_plotdiv"><div class="alert alert-danger mt-5"><strong>Error:</strong> Something went wrong when making the plot.</div></div>');
    console.error(e);
  }
}

function update_umi_plot_names(){
  // Get the default colours
  var colors = Plotly.d3.scale.category20();
  // List to hold unique names
  var names = [];
  // Get the new label id
  var labelname = $('#umi_plot_modal_cat_1').val();
  for (i = 0; i < pdata.length; i++){
    var uid = pdata[i]['uid'];
    var name = t_data[uid][labelname];
    if(names.indexOf(name) < 0){
      names.push(name);
    }
    var colour = colors(names.indexOf(name));
    pdata[i]['name'] = name;
    pdata[i]['line']['color'] = colour;
  }
  Plotly.update('umi_plot_modal_plotdiv', pdata);
}


function plot_metadata(){

  // Check that we have two categories selected
  var label = $('#table_plot_modal_label').val();
  var xcat = $('#table_plot_modal_xaxis').val();
  var ycat = $('#table_plot_modal_yaxis').val();
  if(!label || !xcat || !ycat){ return false; }

  // Reset the plot div
  Plotly.purge('table_plot_modal_plotdiv');
  $('.table_plot_modal_plotdiv_wrapper').empty();
  $('.table_plot_modal_plotdiv_wrapper').html('<div id="table_plot_modal_plotdiv"></div>');

  // Get the IDs of the samples to plot
  var samples = [];
  $('#sample_browse_table tbody tr').each(function(){
    samples.push( $(this).attr('id') );
  });

  // Get the default colours
  var colors = Plotly.d3.scale.category20();
  // List to hold unique names
  var names = [];

  // Get the data
  var pdata = [];
  for(i=0; i<t_data.length; i++){
    if(samples.indexOf(t_data[i]['DT_RowId']) > 0){
      var name = t_data[i][label];
      if(names.indexOf(name) < 0){
        names.push(name);
      }
      var colour = colors(names.indexOf(name));
      pdata.push( {
        name: name,
        uid: t_data[i]['DT_RowId'],
        x: [t_data[i][xcat]],
        y: [t_data[i][ycat]],
        mode: 'markers',
        type: 'scattergl',
        hoverinfo: 'name',
        marker: {
          color: colour,
          size: 12,
        }
      });
    }
  }
  var layout = {
    title:'10XQC Metadata Scatter Plot',
    height: 500,
    width: 600,
    hovermode: 'closest',
    xaxis: {
      title: xcat
    },
    yaxis: {
      title: ycat
    }
  };
  Plotly.newPlot('table_plot_modal_plotdiv', pdata, layout);
}