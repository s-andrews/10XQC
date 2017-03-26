// 10XQC JavaScript - Submitting Reports
$(function() {

  var $form = $("#report_upload_form");
  var $input = $('#report_upload_file');
  var $label = $('#report_upload_form label');

  // Batch file drag & drop interface
  // https://css-tricks.com/drag-and-drop-file-uploading/
  var isAdvancedUpload = function() {
    var div = document.createElement('div');
    return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
  }();

  var droppedFiles = false;
  if (isAdvancedUpload) {
    $form.addClass('has-advanced-upload');
    $form.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
    })
    .on('dragover dragenter', function() {
      $form.addClass('is-dragover alert-success');
      $form.removeClass('is-dragover alert-info');
    })
    .on('dragleave dragend drop', function() {
      $form.removeClass('is-dragover alert-success');
      $form.addClass('is-dragover alert-info');
    })
    .on('drop', function(e) {
      $form.addClass('is-dragover alert-success');
      $form.removeClass('is-dragover alert-info');
      droppedFiles = e.originalEvent.dataTransfer.files;
      $form.trigger('submit');
    });
  }

  // Manual submit button
  $input.on('change', function(e) {
    $form.trigger('submit');
  });

  // Catch report uploads and process in the browser
  $form.submit(function(e) {

    // Don't submit the form to the server
    e.preventDefault();

    // Loading text
    $form.find('.fa').removeClass().addClass('fa fa-spinner fa-spin fa-3x fa-fw');
    $label.text('Processing reports..');

    // Simple input field uploads
    if(!isAdvancedUpload || !droppedFiles){
      droppedFiles = [$input[0]['files'][0]];
    }

    // Process each file upload
    var parsed_data = [];
    var failed_files = [];
    $.each(droppedFiles, function(idx, file){

      // Sanity checks
      if(file.name.split('.').pop().toLowerCase() !== 'html'){
        console.log("Filename did not end in .html: "+file.name);
        failed_files.push(file.name);
        if((parsed_data.length + failed_files.length) == droppedFiles.length){
          second_form(parsed_data, failed_files);
        }
        return true;
      }

      // Set up JS file reader
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          // First, entire file is in base64
          var matches = e.target.result.match(/^data:text\/html;base64,(.*)$/);
          var base64_data = matches[1];
          var file_hash = sha1(base64_data);
          var raw_report = atob(base64_data, 'base64');

          // Pull out the compressed data
          var compressed_data_matches = raw_report.match(/var compressed_data = '([^']+)';/);
          var compressed_data = compressed_data_matches[1];

          // Decompress the data and pass on to form
          var data = JSON.parse(LZString.decompressFromEncodedURIComponent(compressed_data));
          parsed_data.push([data, file_hash]);
          if((parsed_data.length + failed_files.length) == droppedFiles.length){
            second_form(parsed_data, failed_files);
          }
        } catch(j){
          console.log("Error parsing report: "+j);
          failed_files.push(file.name);
          if((parsed_data.length + failed_files.length) == droppedFiles.length){
            second_form(parsed_data, failed_files);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  });


  // Copy values across from first column
  $('#manual_metadata_copyvals').click(function(e){
    e.preventDefault();
    $('#manual_metadata_table tbody tr').each(function(){
      var val = $(this).find('td:eq(1) input, td:eq(1) select').val();
      $(this).find('td:gt(1) input, td:gt(1) select').val(val);
      if($(this).find('td:eq(1) .form-group').hasClass('has-success')){
        $(this).find('td:gt(1) .form-group').removeClass('has-danger').addClass('has-success');
      }
    });
  });


  // Form Validation
  $.validator.setDefaults({
      highlight: function(element) {
          $(element).closest('.form-group').addClass('has-danger').removeClass('has-success');
          $('#validation_errors').slideDown(); // Show single warning that there were missing fields
      },
      unhighlight: function(element) {
          $(element).closest('.form-group').removeClass('has-danger').addClass('has-success');
      },
      errorPlacement: function(error,element) { return true; } // No message
  });
  $("#report_metadata_form").validate();

});

function second_form(parsed_data, failed_files){
  var report_field_ids = [
    'report_file_hash',
    'report_sample_id',
    'report_sample_desc',
    'report_chemistry_description',
    'report_transcriptome',
    'report_version',
    'report_estimated_number_of_cells',
    'report_mean_reads_per_cell',
    'report_median_genes_per_cell',
    'report_number_of_reads',
    'report_valid_barcodes',
    'report_reads_mapped_confidently_to_transcriptome',
    'report_reads_mapped_confidently_to_exonic_regions',
    'report_reads_mapped_confidently_to_intronic_regions',
    'report_reads_mapped_confidently_to_intergenic_regions',
    'report_sequencing_saturation',
    'report_q30_bases_in_barcode',
    'report_q30_bases_in_rna_read',
    'report_q30_bases_in_sample_index',
    'report_q30_bases_in_umi',
    'report_fraction_reads_in_cells',
    'report_total_genes_detected',
    'report_median_umi_counts_per_cell',
    'report_barcode_rank_plot_data'
  ];
  var report_field_titles = [
    'File sha1 Hash (unique identifier)',
    'Sample ID',
    'Sample Description',
    'Chemistry Description',
    'Transcriptome',
    'Cell Ranger Version',
    'Estimated Number of Cells',
    'Mean Reads per Cell',
    'Median Genes per Cell',
    'Number of Reads',
    'Valid Barcodes',
    'Reads Mapped Confidently to Transcriptome',
    'Reads Mapped Confidently to Exonic Regions',
    'Reads Mapped Confidently to Intronic Regions',
    'Reads Mapped Confidently to Intergenic Regions',
    'Sequencing Saturation',
    'Q30 Bases in Barcode',
    'Q30 Bases in RNA Read',
    'Q30 Bases in Sample Index',
    'Q30 Bases in UMI',
    'Fraction Reads in Cells',
    'Total Genes Detected',
    'Median UMI Counts per Cell',
    'UMI Counts / Barcodes Plot Data'
  ];

  // Show a warning about any files that could not be parsed
  if(failed_files.length > 0){
    $.each(failed_files, function(idx, fn){
      $('#report_metadata_failure_alert ul').append('<li><code>'+fn+'</code></li>');
    });
    $('#report_metadata_failure_alert').slideDown();
    if(parsed_data.length > 0){
      $('.report_metadata_failure_continue').show();
    } else {
      $('.report_metadata_failure_complete').show();
      $('#report_upload_form_div').slideUp();
      return false;
    }
  }

  // Hide the multi-sample buttons if only one sample
  if(parsed_data.length < 2){
    $('#manual_metadata_copyvals').hide();
  }

  // Build the data structure used by the form
  var form_data = [];
  for(i=0; i < parsed_data.length; i++){
    var data = parsed_data[i][0];
    var file_hash = parsed_data[i][1];
    form_data[i] = {};
    form_data[i]['report_file_hash'] = file_hash;
    form_data[i]['report_sample_id'] = data['sample_id'];
    form_data[i]['report_sample_description'] = data['sample_desc'];
    form_data[i]['report_version'] = data['version'];
    form_data[i]['report_chemistry_description'] = data['info']['chemistry_description'];
    form_data[i]['report_transcriptome'] = data['genomes'].join(', ');
    for (var table in data['tables']) {
      for (var row in data['tables'][table]['rows']){
        var dtitle = data['tables'][table]['rows'][row][0]['v'];
        var dval = data['tables'][table]['rows'][row][2]['v'].trim();
        var report_field_idx = report_field_titles.indexOf(dtitle);
        // Remove commas in numbers
        if (dval.match(/^[,\d]+$/)){
          dval = dval.replace(/,/g,'');
        }
        if (report_field_idx > -1){
          form_data[i][ report_field_ids[report_field_idx] ] = dval;
        }
      }
    }

    // Parse plot data
    for (var p in data['charts']){
      if(typeof data['charts'][p]['layout'] != 'undefined' && data['charts'][p]['layout']['title'] == 'Barcode Rank'){
        var p_xdata = [];
        var p_ydata = [];
        for (var j = 0; j < data['charts'][p]['data'].length; j++) {
          p_xdata.push.apply(p_xdata, data['charts'][p]['data'][j]['x']);
          p_ydata.push.apply(p_ydata, data['charts'][p]['data'][j]['y']);
        }
        form_data[i]['report_barcode_rank_plot_data'] = JSON.stringify([p_xdata,p_ydata]);
      }
    }

    // Copy new set of manual form fields
    if(i == 0){
      // First row - just rename the table header
      $('#manual_metadata_table thead tr th:nth-child(2)').text(form_data[0]['report_sample_id']);
      $('#report_fields_table thead tr th:nth-child(2)').text(form_data[0]['report_sample_id']);
    } else {
      // Clone first column and update number in id + name
      $('#manual_metadata_table thead tr').append('<th>'+form_data[i]['report_sample_id']+'</th>');
      $('#report_fields_table thead tr').append('<th>'+form_data[i]['report_sample_id']+'</th>');
      $('#manual_metadata_table tbody tr td:nth-child(2)').each(function(){
        var clone = $(this).clone();
        var nid = clone.find('select, input').attr('id').replace('_0', '_'+i);
        clone.find('select, input').attr('id', nid).attr('name', nid);
        $(this).parent().append(clone);
      });
    }

    // Create automatic form fields
    for (var j = 0; j < report_field_ids.length; j++) {
      // Prepare value with optional field addons
      var value = form_data[i][report_field_ids[j]];
      var input_gp = '';
      var input_addon = '';
      if(value == undefined){ value = ''; }
      if(value.substr(-1) == '%'){
        value = value.slice(0, -1);
        input_gp = 'input-group';
        input_addon = '<div class="input-group-addon">%</div>';
      }
      // First sample - build table contents from scratch
      if(i == 0){
        $('#report_fields_table tbody').append(' \
          <tr id="'+report_field_ids[j]+'_trow"> \
            <td><label for="'+report_field_ids[j]+'_'+i+'" class="col-form-label">'+report_field_titles[j]+'</label></td> \
            <td><div class="'+input_gp+'"> \
              <input id="'+report_field_ids[j]+'_'+i+'" name="'+report_field_ids[j]+'_'+i+'" class="form-control" type="text" readonly value="'+value+'"> \
              ' + input_addon + '\
            </div></td> \
          </tr> \
        ');
      }
      // subsequent samples - just add extra column to existing row
      else {
        $('#'+report_field_ids[j]+'_trow').append(
          '<td><div class="'+input_gp+'"> \
            <input id="'+report_field_ids[j]+'_'+i+'" name="'+report_field_ids[j]+'_'+i+'" class="form-control" type="text" readonly value="'+value+'"> \
            ' + input_addon + '\
          </div></td> \
        ');
      }
    }
  }

  // Download as CSV for offline processing
  // TODO: Not written yet!
  $('#manual_metadata_download').hide();

  // Show the form!
  $('#report_upload_form_div').slideUp();
  $('#report_metadata_form').slideDown();
}