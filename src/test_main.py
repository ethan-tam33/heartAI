import csv
import requests
from typings import MedicalRecord
from typing import List

api_url = "http://localhost:8000/insert_records/"

# lets say we have a csv file that maps a patient to their heart embedding
pat_to_embed = {}
for i in range(59):
    # make a random list of size 128 of floats
    pat_to_embed[i] = [i / 100 for i in range(128)]

def load_csv_data(file_path: str) -> List[MedicalRecord]:
    records = []
    with open(file_path, 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            heart_embedding = pat_to_embed[int(row['Pat'])]
            record = MedicalRecord(
                Pat=int(row['Pat']),
                Age=int(row['Age']),
                Category=row['Category'],
                heart_embedding=heart_embedding,
                Normal=row['Normal'] == 'X',
                MildModerateDilation=row['MildModerateDilation'] == 'X',
                VSD=row['VSD'] == 'X',
                ASD=row['ASD'] == 'X',
                DORV=row['DORV'] == 'X',
                DLoopTGA=row['DLoopTGA'] == 'X',
                ArterialSwitch=row['ArterialSwitch'] == 'X',
                BilateralSVC=row['BilateralSVC'] == 'X',
                SevereDilation=row['SevereDilation'] == 'X',
                TortuousVessels=row['TortuousVessels'] == 'X',
                Dextrocardia=row['Dextrocardia'] == 'X',
                Mesocardia=row['Mesocardia'] == 'X',
                InvertedVentricles=row['InvertedVentricles'] == 'X',
                InvertedAtria=row['InvertedAtria'] == 'X',
                LeftCentralIVC=row['LeftCentralIVC'] == 'X',
                LeftCentralSVC=row['LeftCentralSVC'] == 'X',
                LLoopTGA=row['LLoopTGA'] == 'X',
                AtrialSwitch=row['AtrialSwitch'] == 'X',
                Rastelli=row['Rastelli'] == 'X',
                SingleVentricle=row['SingleVentricle'] == 'X',
                DILV=row['DILV'] == 'X',
                DIDORV=row['DIDORV'] == 'X',
                CommonAtrium=row['CommonAtrium'] == 'X',
                Glenn=row['Glenn'] == 'X',
                Fontan=row['Fontan'] == 'X',
                Heterotaxy=row['Heterotaxy'] == 'X',
                SuperoinferiorVentricles=row['SuperoinferiorVentricles'] == 'X',
                PAAtresiaOrMPAStump=row['PAAtresiaOrMPAStump'] == 'X',
                PABanding=row['PABanding'] == 'X',
                AOPAAnastamosis=row['AOPAAnastamosis'] == 'X',
                Marfan=row['Marfan'] == 'X',
                CMRArtifactAO=row['CMRArtifactAO'] == 'X',
                CMRArtifactPA=row['CMRArtifactPA'] == 'X'
            )
            records.append(record)
    print(len(records))
    return records

def send_request(records: List[MedicalRecord], batch_size: int = 10):
    print("hellooo")
    print(len(records))
    #response = requests.post(api_url, json=[record.dict() for record in records])
    response = requests.post(api_url, json=[records[0].dict()])
    if response.status_code == 200:
        print("Records inserted successfully!")
    else:
        print(f"Failed to insert records. Status code: {response.status_code}, {response.text}")

records = load_csv_data('./data/hvsmr_clinical.csv')
send_request(records)