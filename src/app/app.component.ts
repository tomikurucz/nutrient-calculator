import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms'
import * as XLSX from 'xlsx';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  myForm: FormGroup;
  plants: string[];
  soilTypes: string[];
  years: string[];
  nutrientSupply: string[];

  plantValues: any[];
  correctionValues: any[];

  nitrogenResult: string;
  phosphorResult: string;
  potassiumResult: string;

  nitrogenCorrectedResult: string;
  phosphorCorrectedResult: string;
  potassiumCorrectedResult: string;

  displayError: boolean;
  errorMessage: String;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.plants = [];
    this.soilTypes = [];
    this.years = [];
    this.nutrientSupply = ['alacsony', 'közepes', 'jó'];

    this.plantValues = [];
    this.correctionValues = [];

    this.nitrogenResult = "";
    this.phosphorResult = "";
    this.potassiumResult = "";

    this.nitrogenCorrectedResult = "";
    this.phosphorCorrectedResult = "";
    this.potassiumCorrectedResult = "";

    this.displayError = false;
    this.errorMessage = "";

    this.myForm = this.fb.group({
          year: '',
          tableName: '',
          plantName: '',
          projectedReturn: '',
          placeOfProduction: '',
          nitrogen: '',
          phosphor : '',
          potassium: '',
          preCropPlant: '',
          preCropYield: '',
          preCropStemIncorporation: '',
          nitrateSensitiveBlock: '',
          irrigatedArea: '',
        })
  }

  ngOnInit() {
    this.loadExcelData();

    this.myForm.valueChanges.subscribe(()=>{
      this.displayError = false;
      this.calculateResults();
      this.calculateCorrectedResults();
    });

  }

 showErrorMessage(msg: String){
    this.errorMessage = msg;
    this.displayError = true;
 }

  checkProjectedReturnValue(){
    const value = this.myForm.get('projectedReturn')?.value;

    if(isNaN(Number(value))){
      this.myForm.get('projectedReturn')?.setValue('');
      this.showErrorMessage("A tervezett hozam értékének 2.5 és 25 között kell lennie.");
    } else {
        if(Number(value) > 25) {
          this.myForm.get('projectedReturn')?.setValue('25');
          this.showErrorMessage("A tervezett hozam értékének 2.5 és 25 között kell lennie.");
        } else if(Number(value) < 2.5) {
          this.myForm.get('projectedReturn')?.setValue('2.5');
          this.showErrorMessage("A tervezett hozam értékének 2.5 és 25 között kell lennie.");
         }
    }
  }

  checkPreCropYieldValue(){
      const value = this.myForm.get('preCropYield')?.value;

      if(isNaN(Number(value))){
        this.myForm.get('preCropYield')?.setValue('');
        this.showErrorMessage("Adjon meg egy számértéket!");
      }
    }

  calculateResults(){
      const plantName = this.myForm.get('plantName')?.value;
      const placeOfProduction = this.myForm.get('placeOfProduction')?.value;
      const projectedReturn = this.myForm.get('projectedReturn')?.value;

      const nitrogen = this.myForm.get('nitrogen')?.value;
      const phosphor = this.myForm.get('phosphor')?.value;
      const potassium = this.myForm.get('potassium')?.value;
      if(projectedReturn != '' && plantName != '' && placeOfProduction != '' && nitrogen != '' && phosphor != '' && potassium != ''){
        var n = nitrogen=='alacsony'?'N1':nitrogen=='közepes'?'N3':'N4';
        var ph = phosphor=='alacsony'?'P1':phosphor=='közepes'?'P3':'P4';
        var po = potassium=='alacsony'?'K1':potassium=='közepes'?'K3':'K4';

        const searchedPlant = this.plantValues.find(p => p.plant==plantName && p.soilType == placeOfProduction);
        const nitrogenValue = searchedPlant[n]
        const phosphorValue = searchedPlant[ph];
        const potassiumValue = searchedPlant[po];

        this.nitrogenResult = (projectedReturn * nitrogenValue).toString();
        this.phosphorResult = (projectedReturn * phosphorValue).toString();
        this.potassiumResult = (projectedReturn * potassiumValue).toString();
      } else {
        this.nitrogenResult = "";
        this.phosphorResult = "";
        this.potassiumResult = "";
      }
  }

  calculateCorrectedResults() {
      const preCropPlant = this.myForm.get('preCropPlant')?.value;
      const preCropYield = this.myForm.get('preCropYield')?.value;
      const preCropStemIncorporation = this.myForm.get('preCropStemIncorporation')?.value;
      const nitrateSensitiveBlock = this.myForm.get('nitrateSensitiveBlock')?.value;
      const irrigatedArea = this.myForm.get('irrigatedArea')?.value;

      if(this.nitrogenResult != '' && this.phosphorResult != '' && this.potassiumResult != '' &&
       preCropPlant != '' && preCropYield != ''){
        const searchedPlant = this.correctionValues.find(c=>c.plant==preCropPlant);

        var nitrogenCorrection = searchedPlant.N;
        var phosphorCorrection = searchedPlant.P;
        var potassiumCorrection = searchedPlant.K;

        if(nitrogenCorrection.includes("-")){
          this.nitrogenCorrectedResult = (Number(this.nitrogenResult)-nitrogenCorrection.slice(1)).toString();
        } else if(nitrogenCorrection.includes("x")){
          this.nitrogenCorrectedResult = (Number(this.nitrogenResult)-preCropYield*nitrogenCorrection.slice(1)).toString();
        } else if(nitrogenCorrection == "0"){
          this.nitrogenCorrectedResult = this.nitrogenResult;
        }

        if(phosphorCorrection.includes("-")){
           this.phosphorCorrectedResult = (Number(this.phosphorResult)-phosphorCorrection.slice(1)).toString();
         } else if(phosphorCorrection.includes("x")){
           this.phosphorCorrectedResult = (Number(this.phosphorResult)-preCropYield*phosphorCorrection.slice(1)).toString();
         } else if(phosphorCorrection == "0"){
           this.phosphorCorrectedResult = this.phosphorResult;
         }

        if(potassiumCorrection.includes("-")){
          this.potassiumCorrectedResult = (Number(this.potassiumResult)-potassiumCorrection.slice(1)).toString();
        } else if(potassiumCorrection.includes("x")){
          this.potassiumCorrectedResult = (Number(this.potassiumResult)-preCropYield*potassiumCorrection.slice(1)).toString();
        }  else if(potassiumCorrection == "0"){
           this.potassiumCorrectedResult = this.potassiumResult;
        }

      if(irrigatedArea == true){
        this.nitrogenCorrectedResult = (0.9*Number(this.nitrogenCorrectedResult)).toString();
        this.phosphorCorrectedResult = (0.9*Number(this.phosphorCorrectedResult)).toString();
        this.potassiumCorrectedResult = (0.9*Number(this.potassiumCorrectedResult)).toString();
      }




      } else {
          this.nitrogenCorrectedResult = '';
          this.phosphorCorrectedResult = '';
          this.potassiumCorrectedResult = '';
        }

      if(nitrateSensitiveBlock == true) {
              this.showErrorMessage("Vegye figyelembe a jogszabály iránmutatásait, a maximálisan kiadható mennyiségek tekintetében!")
            }
  }

  filterPlantNames(arr: any[]): string[] {
      const plantNames = [...new Set(arr.map(obj => obj.plant))];
      return plantNames;
  }

  filterPlantSoilTypes(arr: any[]): string[] {
        const soilTypes = [...new Set(arr.map(obj => obj.soilType))];
        return soilTypes;
    }

    filterYears(arr: any[]): string[] {
            const years = [...new Set(arr.map(obj => obj.year))];
            return years;
        }

  loadExcelData() {
      this.http.get('assets/nutrient_calculator_values.xlsx', { responseType: 'arraybuffer' }).subscribe((data) => {
        const arrayBuffer: ArrayBuffer = data;
        const workbook: XLSX.WorkBook = XLSX.read(arrayBuffer, { type: 'array' });
        const worksheetName: string = workbook.SheetNames[0];
        const worksheet: XLSX.WorkSheet = workbook.Sheets[worksheetName];
        this.plantValues = XLSX.utils.sheet_to_json(worksheet, { raw: false });
        this.plants = this.filterPlantNames(this.plantValues);
        this.soilTypes = this.filterPlantSoilTypes(this.plantValues);

        const worksheetName1: string = workbook.SheetNames[1];
        const worksheet1: XLSX.WorkSheet = workbook.Sheets[worksheetName1];
        const yearValues = XLSX.utils.sheet_to_json(worksheet1, { raw: false });
        this.years = this.filterYears(yearValues);

        const worksheetName2: string = workbook.SheetNames[2];
        const worksheet2: XLSX.WorkSheet = workbook.Sheets[worksheetName2];
        this.correctionValues = XLSX.utils.sheet_to_json(worksheet2, { raw: false });
      });
    }
}
