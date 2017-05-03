#!/usr/bin/perl
use warnings;
use strict;
use CGI;
use CGI::Carp qw(fatalsToBrowser);
use DBI;
use FindBin qw($RealBin);
use lib "$RealBin/../";
use xqc::Constants;
use JSON;
use HTML::Template;

# Read config
my $config;

# Make DB connectionmy 
my $dbh = DBI->connect("DBI:mysql:database=".$xqc::Constants::DB_NAME.";host=".$xqc::Constants::DB_SERVER,$xqc::Constants::DB_USERNAME,$xqc::Constants::DB_PASSWORD,{RaiseError=>0,AutoCommit=>1});

unless ($dbh) {
    die "Couldn't connect to database";
}

# Get a CGI handle
my $q = CGI -> new();


# These are the variables we're dealing with.
my @vars = qw(
meta_cell_state
report_reads_mapped_confidently_to_transcriptome
report_file_hash
report_q30_bases_in_sample_index
report_q30_bases_in_barcode
report_estimated_number_of_cells
report_q30_bases_in_rna_read
meta_sequencing_technology
report_version
report_median_umi_counts_per_cell
report_transcriptome
report_valid_barcodes
report_sample_desc
report_barcode_rank_plot_data
report_mean_reads_per_cell
meta_tissue_dissociation
meta_scrnaseq_method
report_reads_mapped_confidently_to_intergenic_regions
meta_num_cells_loaded
report_sample_id
meta_cell_line_tissue
report_q30_bases_in_umi
meta_sample_type
meta_cell_counting_method
report_fraction_reads_in_cells
report_total_genes_detected
report_sequencing_saturation
report_chemistry_description
report_number_of_reads
meta_species
report_reads_mapped_confidently_to_intronic_regions
meta_max_cell_size
report_reads_mapped_confidently_to_exonic_regions
meta_min_cell_size
report_median_genes_per_cell
);

# Fields in the values are Short name, Long name, show by default, numeric

my %output_vars = (
id => ["id","id",0,0],
meta_cell_state => ["Cell State","Cell State",0,0],
report_reads_mapped_confidently_to_transcriptome => ["Transcriptome Reads", "Reads Mapped Confidently to Transcriptome",0,1],
report_file_hash => ["File Hash","File sha1 Hash (unique identifier",0,0],
report_q30_bases_in_sample_index => ["% Q30 in Sample Index","Q30 Bases in Sample Index",0,1],
report_q30_bases_in_barcode => ["% Q30 in Barcode","Q30 Bases in Barcode",0,1],
report_estimated_number_of_cells => ["Estimated # Cells","Estimated Number of Cells",1,1],
report_q30_bases_in_rna_read => ["% Q30 in RNA Read","Q30 Bases in RNA Read",0,1],
meta_sequencing_technology => ["Sequencing Technology","Sequencing Technology",0,0],
report_version => ["Cell Ranger Version","Cell Ranger Version",0,0],
report_median_umi_counts_per_cell => ["Median UMI Counts per Cell","Median UMI Counts per Cell",1,1],
report_transcriptome =>["Transcriptome","Transcriptome",0,0],
report_valid_barcodes => ["Valid Barcodes","Valid Barcodes",0,1],
report_sample_desc => ["Sample Description","Sample Description",0,0],
report_mean_reads_per_cell => ["Mean Reads per Cell","Mean Reads per Cell",1,1],
meta_tissue_dissociation => ["Tissue Dissociation","Tissue Dissociation",0,0],
meta_scrnaseq_method => ["scRNA-Seq method","scRNA-Seq method",0,0],
report_reads_mapped_confidently_to_intergenic_regions => ["Intergenic Regions Reads","Reads Mapped Confidently to Intergenic Regions",0,1],
meta_num_cells_loaded => ["# Cells loaded","Estimated number of cells loaded",1,1],
report_sample_id => ["Sample ID","Sample ID",0,0],
meta_cell_line_tissue => ["Cell Line / Tissue","Cell Line / Tissue Type",1,0],
report_q30_bases_in_umi => ["% Q30 in UMI","Q30 Bases in UMI",0,1],
meta_sample_type => ["Sample type","Sample type",1,0],
meta_cell_counting_method => ["Counting Technology","Cell counting technology",0,0],
report_fraction_reads_in_cells => ["Fraction Reads in Cells","Fraction Reads in Cells",1,1],
report_total_genes_detected => ["Total Genes Detected","Total Genes Detected",0,1],
report_sequencing_saturation => ["Sequencing Saturation","Sequencing Saturation",0,1],
report_chemistry_description => ["Chemistry Description","Chemistry Description",0,0],
report_number_of_reads => ["Number of Reads","Number of Reads",0,1],
meta_species => ["Species","Species",1,0],
report_reads_mapped_confidently_to_intronic_regions => ["Intronic Regions Reads","Reads Mapped Confidently to Intronic Regions",0,1],
meta_max_cell_size => ["Max cell size (μm)","Max cell size (μm)",0,1],
report_reads_mapped_confidently_to_exonic_regions => ["Exonic Regions Reads","Reads Mapped Confidently to Exonic Regions",0,1],
meta_min_cell_size => ["Min cell size (μm)","Min cell size (μm)",0,1],
report_median_genes_per_cell => ["Median Genes per Cell","Median Genes per Cell",1,1],
);

if ($q -> param("action") eq 'submit') {
    
    # Make up a submission STH

    my $insert_sth =  $dbh->prepare("INSERT INTO report (".join(",",@vars).") VALUES (".("?,"x$#vars)."?)") or die "Can't create insert sth: $dbh->errstr()";
# See what we've got
    
# Now go through the submission and check how many reports we can submit
    
    my $report_number = 0;
    
    my @warnings;
    my @errors;

    TOP: while (1) {

	# Do a quick sanity check that this report exists
	last unless ($q -> param("report_version_$report_number"));

	my @bind_params;

	my $hash;

	foreach my $var (@vars) {
	    my $value = $q -> param("${var}_$report_number");

	    unless (defined $value) {
		push @warnings,"Report_$report_number: No value for $var in report $report_number\n";
	    }

	    if ($var eq 'report_file_hash') {
		$hash = $value;
	    }

	    push @bind_params,$value;
	} 

	# Check the hash doesn't exist already

	my ($existing_id) = $dbh->selectrow_array("SELECT id FROM report WHERE report_file_hash=?",undef,$hash);

	if (defined $existing_id) {
	    push @errors, "Report_$report_number: This report is already in the database";
	    ++$report_number;
	    next TOP;
	}

	# Add the report
	$insert_sth -> execute(@bind_params) or do {
	    push @warnings,"Failed to insert report $report_number: ".$dbh->errstr();
	};

	++$report_number;

    }

    write_status("Reports submitted","Submitted ".($report_number - scalar @errors)." reports successfully",\@errors,\@warnings); 
}

elsif ($q -> param("action") eq 'rankdata') {

    my @ids = split(/,/,$q->param('ids'));

    my $sth = $dbh->prepare("SELECT report_sample_id,report_barcode_rank_plot_data FROM report WHERE id=?");

#    print "Content-type: text/plain\n\n";
     print "Content-type: application/json\n\n";

    print "{\n\t\"data\": [\n";

    my $json = JSON::PP->new->ascii->pretty->allow_nonref;


    my $all_ids;

    my $printed_something = 0;
    foreach my $id (@ids) {
	$sth -> execute($id) or die "Can't get rank data for '$id': ".$dbh->errstr();


	my ($sample_id,$data) = $sth->fetchrow_array();
#	print "\n\n\n$data\n\n\n";
	if ($printed_something) {
	    print ",";
	}
	else {
	    $printed_something = 1;
	}
	print "\t\t[\n\t\t\t\"$sample_id\",\n\t\t\t$data\n\t\t]";


    }

    print "\n\t\t]\n}\n";


}


elsif ($q -> param("action") eq 'fields') {

    my @ids = split(/,/,$q->param('ids'));

    my $sth = $dbh->prepare("SELECT report_sample_id,report_barcode_rank_plot_data FROM report WHERE id=?");

#    print "Content-type: text/plain\n\n";
     print "Content-type: application/json\n\n";


    print "{\n\t\"_column_descriptions\": [\n\t\t\"field_key\",\n\t\t\"Short Name\",\n\t\t\"Longer Name\",\n\t\t\"Show by default (boolean)\",\n\t\t\"Numeric (boolean)\"\n\t],\n\t\"columns\": [\n";



    my @output_vars = sort keys %output_vars;

    my $printed_something = 0;
    foreach my $var (@output_vars) {

	if ($printed_something) {
	    print ",\n";
	}
	else {
	    $printed_something = 1;
	}
	print "\t\t[\n\t\t\t\"$var\",\n\t\t\t\"$output_vars{$var}->[0]\",\n\t\t\t\"$output_vars{$var}->[1]\",\n\t\t\t$output_vars{$var}->[2],\n\t\t\t$output_vars{$var}->[3]\n\t\t]";

    }

    print "\n\t]\n}\n";


}

else {

    # Our default action is to return a json object with
    # all of the data in it.

    my @output_vars = sort keys %output_vars;

    my $sql = "SELECT ".join(",",@output_vars)." FROM report";

    # TODO: Add filters

    print "Content-type: application/json\n\n";

    print "{ \"data\":[\n";

    my $printed_something = 0;
    my $json = JSON::PP->new->ascii->pretty->allow_nonref;

    my $sth = $dbh-> prepare($sql) or die $dbh->errstr();

    $sth -> execute() or die $dbh->errstr();


    while (my @values = $sth->fetchrow_array()) {
	my %hash;
	for (0..$#output_vars) {
	    if ($output_vars[$_] eq 'id') {
		$hash{DT_RowID} = $values[$_];
	    }
	    else {
		$hash{$output_vars[$_]} = $values[$_];
	    }
	}

	if ($printed_something) {
	    print ",\n";
	}
	else {
	    $printed_something = 1;
	}

	print $json->encode(\%hash);

    }

    print "]}\n";


}


sub write_status {
    my ($title,$message,$errors,$warnings) = @_;

    my @errors;
    foreach my $error (@$errors) {
	push @errors,{error => $error};
    }

    my @warnings;
    foreach my $warning (@$warnings) {
	push @warnings,{warning => $warning};
    }

    my $template = HTML::Template->new(filename => "$RealBin/../templates/message_template.html");

    $template -> param(title => $title,
		       message => $message,
		       errors => \@errors,
		       warnings => \@warnings);

    print "Content-type: text/html\n\n";
    print $template->output();

}

