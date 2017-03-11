// 10XQC JavaScript
$(function() {

  // Catch report uploads and process in the browser
  $("#report_upload_form").submit(function(e) {

    // Don't submit the form to the server
    e.preventDefault();

    // Process the file client side
    var file = $('#report_upload_file')[0]['files'][0];
    var reader = new FileReader();
    reader.onload = function (e) {
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
      second_form(data, file_hash);
    };
    reader.readAsDataURL(file);
  });


});

function second_form(data, file_hash){
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
    'report_estimated_number_of_cells',
    'report_fraction_reads_in_cells',
    'report_mean_reads_per_cell',
    'report_median_genes_per_cell',
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
    'Estimated Number of Cells',
    'Fraction Reads in Cells',
    'Mean Reads per Cell',
    'Median Genes per Cell',
    'Total Genes Detected',
    'Median UMI Counts per Cell',
    'UMI Counts / Barcodes Plot Data'
  ];
  var parsed_data = {};
  parsed_data['report_file_hash'] = file_hash;
  parsed_data['report_sample_id'] = data['sample_id'];
  parsed_data['report_sample_description'] = data['sample_desc'];
  parsed_data['report_version'] = data['version'];
  parsed_data['report_chemistry_description'] = data['info']['chemistry_description'];
  parsed_data['report_transcriptome'] = data['genomes'].join(', ');
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
        parsed_data[ report_field_ids[report_field_idx] ] = dval;
      }
    }
  }

  // Parse plot data
  for (var p in data['charts']){
    if(typeof data['charts'][p]['layout'] != 'undefined' && data['charts'][p]['layout']['title'] == 'Barcode Rank'){
      var p_xdata = [];
      var p_ydata = [];
      for (var i = 0; i < data['charts'][p]['data'].length; i++) {
        p_xdata.push.apply(p_xdata, data['charts'][p]['data'][i]['x']);
        p_ydata.push.apply(p_ydata, data['charts'][p]['data'][i]['y']);
      }
      parsed_data['report_barcode_rank_plot_data'] = JSON.stringify([p_xdata,p_ydata]);
    }
  }

  // Create form fields
  for (var i = 0; i < report_field_ids.length; i++) {
    var value = parsed_data[report_field_ids[i]];
    var input_gp = '';
    var input_addon = '';
    if(value == undefined){ value = ''; }
    if(value.substr(-1) == '%'){
      value = value.slice(0, -1);
      input_gp = 'input-group';
      input_addon = '<div class="input-group-addon">%</div>';
    }
    $('#report_fields_div').append(' \
      <div class="form-group row"> \
        <label for="'+report_field_ids[i]+'" class="col-sm-4 col-form-label">'+report_field_titles[i]+'</label> \
        <div class="col-sm-8 '+input_gp+'"> \
          <input id="'+report_field_ids[i]+'" name="sample_id" class="form-control" type="text" readonly value="'+value+'"> \
          ' + input_addon + '\
        </div> \
      </div> \
    ');
  }

  // Show the form!
  $('#report_upload_form_div').slideUp();
  $('#report_metadata_form').slideDown();
}