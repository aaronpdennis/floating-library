# Penn State Floating Library Analysis

This repository provides a visualization of monthly data snapshots for [Penn State's floating collection library](https://www.libraries.psu.edu/psul/access/floatingcollection.html). The files contained here were created for a research assistantship during the 2016 spring semester.

## Downloading

To use this project, [download the ZIP file](https://github.com/aaronpdennis/floating-library/archive/gh-pages.zip) and then extract its contents.

## The Website

The `index.html` file is a static web page for visualizing time series patterns in the floating collection data. To display the site, this repository and all its contents should be hosted on a web server.

## Updating Monthly Snapshots

The data that lives behind the website can be updated using the `update.py` Python script on Mac OS X. Follow these steps to update the website:

**1) Open the Terminal application on Mac OS X and `cd` to the Desktop.**
- The Terminal application is the command line for Mac OS X, and it's where we'll run the Python script that updates the website data. To open Terminal on your Mac, press *COMMAND* + *SPACEBAR* on your keyboard, type "Terminal", then press *ENTER*.
- `cd` means to *change directories*. We're going to be working with files on our Mac's Desktop, so we need to change Terminal's working directory to `~/Desktop`. Type (or copy and paste) `cd ~/Desktop` into Terminal and hit *ENTER* on your keyboard.

**2) Copy this repository with the command `git clone https://github.com/aaronpdennis/floating-library.git`** then `cd` to the `floating-library` directory.
- This is a command that runs from Terminal and downloads this project from the web. Type (or copy and paste) `git clone https://github.com/aaronpdennis/floating-library.git` into Terminal and hit *ENTER* on your keyboard. There will now be a folder (a.k.a. directory) on your Desktop called `floating-library`. Move to this directory by typing (or copying and pasting) `cd floating-library` into Terminal and hit *ENTER* on your keyboard.

**3) Make a subdirectory called `excel-spreadsheets` that contains the spreadsheets for every monthly snapshot**
- These spreadsheets should follow the naming convention `BookFloatSnapshot<YEAR><MONTH><DAY>.xlsx` where `<YEAR>` is the four digit year of the snapshot, `<MONTH>` is the two digit month of the snapshot, and `<DAY>` is the two digit date of the snapshot. For example, a spreadsheet for a snapshot of the floating collection taken on September 4th, 2014 should be named `BookFloatSnapshot20140904.xlsx`.
- If you're updating the data every month, it's best to keep using the same `excel-spreadsheets` subdirectory and add a new spreadsheet for each new snapshot.

**4) Run `python update.py` from the command line**
- On the command line, type `python update.py` and press *ENTER* on your keyboard.
- This runs the Python script included in the repository that parses the excel spreadsheets, aggregates different measures, and then translates them to a format used by the website.
- To check if the visualization is updated, you can run the command `python -m SimpleHTTPServer 8000` and then go to `http://localhost:8000/` in a web browser (like Chrome) and see the website.

#### To Review:

These are the commands you'll run from Terminal. Feel free to copy and paste all of these onto the command line at once.

```
cd ~/Desktop
git clone https://github.com/aaronpdennis/floating-library.git
cd floating-library
cp excel-spreadsheets ./excel-spreadsheets
python update.py
python -m SimpleHTTPServer 8000
```
