import csv

with open("disaster.csv", "rU") as f:
	reader = csv.reader(f)
	
	provinces = []
	disasters = []

	count = 0
	for row in reader:
		if count > 0:
			province = row[5].strip().upper()
			disaster = row[3].strip().upper()

			#get unique province names
			if province not in provinces:
				provinces.append(province)
			if disaster not in disasters:
				disasters.append(disaster)
		count +=1

print sorted(provinces)
print disasters

matrix = [ [0 for x in range(0, len(provinces) + len(disasters))] for y in range (0, len(provinces)+len(disasters))]

with open("disaster.csv", "rU") as f:
	reader = csv.reader(f)

	count = 0
	for row in reader:
		if count > 0:
			province = row[5].strip().upper()
			disaster = row[3].strip().upper()

			p_index = provinces.index(province)
			d_index = disasters.index(disaster)

			#increase count in matrix for corresponding province and disaster
			matrix[p_index][len(provinces) + d_index] +=1
			matrix[len(provinces)+d_index][p_index] +=1
		count +=1

with open("matrix.csv", "w") as f:
	writer = csv.writer(f, delimiter = ",")
	writer.writerows(matrix)

with open("header.csv", "w") as f:
	writer = csv.writer(f, delimiter = ",")
	header = provinces+disasters
	writer.writerow(header)
