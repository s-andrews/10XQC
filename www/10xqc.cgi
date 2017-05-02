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

my @output_vars = qw(
id
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

else {

    # Our default action is to return a json object with
    # all of the data in it.

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

