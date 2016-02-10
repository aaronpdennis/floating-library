# pip install xlrd
# pip install xlwt

import xlrd
import codecs
import string
import json
import copy

filename = 'excel-spreadsheets/' + 'BookFloatSnapshot20150403.xlsx'
data_year = int(filename[17:21])
data_month = int(filename[21:23])

column_number = {'ID':5, 'Title':1, 'Call_Number':2, 'Pub_Year':0, 'Home_Loc':8}

libraries = ['aa','ab','br','bk','bd','de','ds','fe','mk','hb','hn','lv','ma','nk','sl','sv','wb','ws','yk']

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
        if cn[0] == 'K':
            return { 'key': 'K', 'description': lcc['K'] }
        letters = filter(lambda x: x in string.letters, cn)
        try:
            return { 'key': letters, 'description': lcc[letters] }
        except KeyError:
            return 'unclassified'

    print('\nLoading ' + filename + '...\n')
    workbook = xlrd.open_workbook(filename)
    sheets = workbook.sheet_names()

    total = 0
    processed = 0

    for s in sheets:
        if len(s) == 2:

            print('Reading ' + s + ' data...')

            sheet = workbook.sheet_by_name(s)
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

                home_location = str(sheet.cell(i,column_number['Home_Loc']).value).encode('utf-8')[7:9].lower()

                # modify pub year
                pub_year = str(sheet.cell(i,column_number['Pub_Year']).value).encode('utf-8')[0:4]

                try:
                    pub_year = int(pub_year)
                    recency = data_year - pub_year
                except ValueError:
                    pub_year = False

                try:
                    library_exists = libraries.index(home_location) >= 0
                except ValueError:
                    library_exists = False

                if home[:7] == 'STACKS-' and p_index > 0 and library_exists and pub_year:
                    cn_classification = classify(call_number_shortened)
                    if cn_classification != 'unclassified':

                        ## start tallying
                        displacement_matrix[libraries.index(home_location)][libraries.index(s)] += 1
                        call_number_matrix[cn_classification['key']][libraries.index(s)] += 1
                        recency_matrix[recencyClass(recency)][libraries.index(s)] += 1

                        processed += 1


# write data
with open('data/' + str(data_year) + '_' + str(data_month) + '_displacement.json', 'w') as d_outfile:
    json.dump(displacement_matrix, d_outfile)

# write data
with open('data/' + str(data_year) + '_' + str(data_month) + '_call_number.json', 'w') as c_outfile:
    json.dump(call_number_matrix, c_outfile)

# write data
with open('data/' + str(data_year) + '_' + str(data_month) + '_recency.json', 'w') as r_outfile:
    json.dump(recency_matrix, r_outfile)

print('\nProcessed ' + str(processed) + ' out of ' + str(total) + ' books.\n')
