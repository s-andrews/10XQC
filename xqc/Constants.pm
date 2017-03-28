#!/usr/bin/perl
use warnings;
use strict;
use FindBin;

package xqc::Constants;


# The constants below are populated from a file called
# 10xqc.config in the Conf directory of your 10xqc
# installation.  You should not edit any of the values in
# this file, but should use the conf file to alter the
# values stored in this package.

our $DB_SERVER;
our $DB_NAME;
our $DB_USERNAME;
our $DB_PASSWORD;

parse_conf_file ();

sub parse_conf_file {

  unless (-e "$FindBin::RealBin/../Config/10xqc.config") {
    die "No 10xqc.config file found in $FindBin::RealBin/../Config/ - copy the example config file and set the values up for your installation";
  }

  open (CONF,"$FindBin::RealBin/../Config/10xqc.config") or die "Can't open 10xwqc.config file: $!";

  while (<CONF>) {
    chomp;
    next unless ($_);

    next if (/^\s*\#/); # Ignore comments

    my ($name,$value) = split(/\s+/,$_,2);

    if ($name eq 'DB_SERVER') {
      $DB_SERVER = $value;
    }
    elsif ($name eq 'DB_NAME') {
      $DB_NAME = $value;
    }
    elsif ($name eq 'DB_USERNAME') {
      $DB_USERNAME = $value;
    }
    elsif ($name eq 'DB_PASSWORD') {
      $DB_PASSWORD = $value;
    }
    else {
      close CONF;
      die "Unknown configuration otion '$name'";
    }
  }

  close CONF;

}


1;

