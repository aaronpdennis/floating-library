# pip install xlrd
# pip install xlwt

import xlrd
import codecs
import string
import json
import copy
import os

processed_dates = []
for file in os.listdir('data'):
    if file.endswith('_displacement.json'):
        processed_dates.append(file[0:9])

files = []
for file in os.listdir('excel-spreadsheets'):
    if file.endswith('.xlsx'):
        try:
            processed_dates.index(file[17:25])
        except ValueError:
            files.append(file)

def process_snapshot(filename):

    data_year = filename[17:21]
    data_month = filename[21:23]
    data_day = filename[23:25]

    filepath = 'excel-spreadsheets/' + filename

    column_number = {'ID':5, 'Title':1, 'Call_Number':2, 'Pub_Year':0, 'Home_Loc':8}

    libraries = ['AA','AB','BR','BK','BD','DE','DS','FE','MK','HB','HN','LV','MA','NK','SL','SV','WB','WS','YK']

    with open('data/classifications.json') as lcc_file:
        lcc = json.load(lcc_file)

        empty = [0] * len(libraries)

        # create empty displacement_matrix
        displacement_matrix = empty[:]
        for i in range(len(libraries)):
            displacement_matrix[i] = empty[:]

        # create empty call_number_matrix
        call_number_matrix = copy.deepcopy(lcc)
        for l in call_number_matrix:
            call_number_matrix[l] = empty[:]

        # create empty recency_matrix
        recency_matrix = {
            'less than 3 years': empty[:],
            '3 - 5 years': empty[:],
            '6 - 10 years': empty[:],
            '11 - 25 years': empty[:],
            '26 - 50 years': empty[:],
            '51 - 100 years': empty[:],
            'more than 100 years': empty[:]
        }
        def recencyClass(year):
            if year < 3:
                return 'less than 3 years'
            elif year >= 3 and year <= 5:
                return '3 - 5 years'
            elif year >= 6 and year <= 10:
                return '6 - 10 years'
            elif year >= 11 and year <= 25:
                return '11 - 25 years'
            elif year >= 26 and year <= 50:
                return '26 - 50 years'
            elif year >= 51 and year <= 100:
                return '51 - 100 years'
            else:
                return 'more than 100 years'

        def classify(cn):
            cn = cn[:3]
            if len(cn) <= 0:
                return 'unclassified'
            if cn[0] == 'K':
                return { 'key': 'K', 'description': lcc['K'] }
            letters = filter(lambda x: x in string.letters, cn).upper()
            try:
                return { 'key': letters, 'description': lcc[letters] }
            except KeyError:
                return 'unclassified'

        print('\nLoading ' + filename + '...')
        workbook = xlrd.open_workbook(filepath)
        sheets = workbook.sheet_names()

        total = 0
        processed = 0

        for library_sheet in sheets:
            if len(library_sheet) == 2:

                sheet = workbook.sheet_by_name(library_sheet)

                current_library = library_sheet.upper()
                print('Reading ' + current_library + ' data...')

                for i in range(2, sheet.nrows):

                    total += 1

                    # modify home
                    home = str(sheet.cell(i,column_number['Home_Loc']).value).encode('utf-8')

                    # modify call number
                    call_number = filter(lambda x: x in string.printable, str(sheet.cell(i,column_number['Call_Number']).value)).encode('utf-8')
                    p_index = call_number.find('.')
                    call_number_shortened = call_number[:p_index]
                    space_index = call_number.find(' ')
                    if space_index >= 0:
                        call_number_shortened = call_number_shortened[:space_index]

                    home_location = str(sheet.cell(i,column_number['Home_Loc']).value).encode('utf-8')[7:9].upper()

                    # modify pub year
                    pub_year = str(sheet.cell(i,column_number['Pub_Year']).value).encode('utf-8')[0:4]

                    try:
                        pub_year = int(pub_year)
                        recency = int(data_year) - pub_year
                    except ValueError:
                        pub_year = False

                    try:
                        library_exists = libraries.index(home_location) >= 0
                    except ValueError:
                        library_exists = False

                    if home[:7] == 'STACKS-' and library_exists and pub_year:
                        cn_classification = classify(call_number_shortened)
                        if cn_classification != 'unclassified':

                            ## start tallying
                            displacement_matrix[libraries.index(home_location)][libraries.index(current_library)] += 1
                            call_number_matrix[cn_classification['key']][libraries.index(current_library)] += 1
                            recency_matrix[recencyClass(recency)][libraries.index(current_library)] += 1

                            processed += 1


    # write data
    with open('data/' + str(data_year) + str(data_month) + str(data_day) + '_displacement.json', 'w') as d_outfile:
        json.dump(displacement_matrix, d_outfile)

    # write data
    with open('data/' + str(data_year) + str(data_month) + str(data_day) + '_call_number.json', 'w') as c_outfile:
        json.dump(call_number_matrix, c_outfile)

    # write data
    with open('data/' + str(data_year) + str(data_month) + str(data_day) + '_recency.json', 'w') as r_outfile:
        json.dump(recency_matrix, r_outfile)

    print('Processed ' + str(processed) + ' out of ' + str(total) + ' books. ' + "%.2f" % (float(processed)/float(total)*float(100)) + '%\n')

for x in files:
    process_snapshot(x)
