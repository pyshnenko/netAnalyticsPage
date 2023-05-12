import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { date, time, format } from './types/types';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ru';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

function App() {

  const trig = useRef(true);
  const [ int, setInt ] = useState('1');
  const [ trf, setTrf ] = useState('day');
  const [ width, setWidth ] = useState(0);
  const [ labels, setLabels ] = useState<any[]>([]);
  const [ statistic, setStatistic ] = useState<any>({});
  const [ ready, setReady ] = useState(false);
  const [ totalData, setTotalData ] = useState({rx: '', tx: ''});
  const [ startDate, setStartDate] = useState<{ str: string, num: number, }|undefined>({str: '2020-01-01T00:00', num: 0});
  const [ endDate, setEndDate] = useState<{ str: string, num: number, }|undefined>({str: (new Date()).toISOString(), num: Number(new Date())});
  const [ data, setData ] = useState({
    labels: labels,
    datasets: [{
      fill: false,
      label: 'Посуточный график',
      data: [0,0,0,0,0],
      backgroundColor: [
        'rgb(153, 102, 255)'
      ],
      borderColor: [
        'rgb(153, 102, 255)'
      ],
      borderWidth: 1
    }]
  });

  const fetchData = async () => {
    trig.current = false;
    const rData = await fetch('https://spamigor.site/stat/stat.json');
    const data = await rData.json();
    return data;
  }

  const strDate = (obj: {day: number, month: number, year: number}) => {
    let a = new Date();
    a.setDate(obj.day);
    a.setMonth(obj.month - 1);
    a.setFullYear(obj.year);
    return a.toLocaleDateString()
  }

  const readyDataToChart = (int: number, traffic: string) => {
    console.log('ready')
    let lblArr: string[] = [];
    let rxArr: number[] = [];
    let txArr: number[] = [];
    statistic.interfaces[int].traffic[traffic].map((item: any)=>{
      let ddt: {str: string, num: number}|undefined = dateGen(
        item.date, 
        item.time, 
        traffic==='day' ? format.onlyDate : 
        traffic==='hour'?format.full:
        traffic==='fiveminute'?format.onlyTime:
        traffic==='month'?format.myDate:
        traffic==='year'?format.yDate : format.onlyDate);
      if ((ddt!==undefined)&&(endDate!==undefined)&&(startDate!==undefined)&&(ddt.num>=startDate.num)&&(ddt.num<endDate.num)) {
        lblArr.push(ddt.str as string); 
        rxArr.push(item.rx/1024/1024); 
        txArr.push(item.tx/1024/1024)
      }
    });
    setDataToChart(lblArr, rxArr, txArr);
  }

  const setDataToChart = (lbl: string[], axs1: number[], axs2: number[]) => {
    console.log('setData')
    setLabels(lbl);
    setData({
      labels: lbl,
      datasets: [{
        fill: false,
        label: 'Посуточный график rx' ,
        data: axs1,
        borderColor: ['rgb(53, 162, 235)'],
        backgroundColor: ['rgba(53, 162, 235, 0.5)'],
        borderWidth: 1
      },{
        fill: false,
        label: 'Посуточный график tx',
        data: axs2,
        borderColor: ['rgb(162, 53, 235)'],
        backgroundColor: ['rgba(162, 53, 235, 0.5)'],
        borderWidth: 1
      }]
    })
  }

  useEffect(() => {
    if (trig.current) {
      let data = fetchData();
      data.then((res)=>{
        console.log(res);
        let arrL: any[] = [];
        let arrD: any[] = [];
        let arrDD: any[] = [];
        res.interfaces[1].traffic.day.map((item: any)=>{arrL.push(strDate(item.date)); arrD.push(item.rx/1024/1024); arrDD.push(item.tx/1024/1024)});
        setDataToChart(arrL, arrD, arrDD);
        setStatistic(res);
        setReady(true);
        let ddt = dateGen(res.interfaces[1].created.date, undefined, format.iso)
        if (ddt!==undefined) setStartDate(ddt);
      });
    }
    
    const handleResize = (event: any) => {
      setWidth(event.target.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
    };

  },[]);

  useEffect(()=> {
    if (ready) {
      const prom = new Promise((res)=>extVal(statistic.interfaces[int].traffic.total.rx, 0, res))
      prom.then((res)=>{
        let rx:string = '';
        rx+=res;
        const prom2 = new Promise((res)=>extVal(statistic.interfaces[int].traffic.total.tx, 0, res))
        prom2.then((res2)=>{
          let tx:string = '';
          tx += res2;
          setTotalData({rx, tx});
        })
      })
    }
  }, [int, ready])

  useEffect(()=>{
    if (ready) readyDataToChart(Number(int), trf)
  },[startDate, endDate])

  const handleChange = (event: SelectChangeEvent) => {
    setInt(event.target.value);
    readyDataToChart(Number(event.target.value), trf);
  };


  const handleChangeT = (event: SelectChangeEvent) => {
    setTrf(event.target.value);
    readyDataToChart(Number(int), event.target.value);
  };

  const extVal = (val: number, iter: number, res: any) => {
    let sVal = (iter===0?'B':iter===1?'kB':iter===2?'MB':iter===3?'GB':iter===4?'TB':'PB')
    if (val<1024) {
      res(`${val.toFixed(2)} ${sVal}`)
    }
    else extVal(val/1024, iter+1, res);
  }

  const dateGen = (date: date|undefined, time: time|undefined, format: format|undefined, numb?: number|string|undefined) => {
    let dt = new Date(numb!==undefined ? numb : 0);
    if (date!==undefined) {
      dt.setFullYear(date.year);
      if (date.month!==undefined) dt.setMonth((date.month as number)-1);
      if (date.day!==undefined) dt.setDate((date.day) as number);
      dt.setHours(0)
    }
    if (time!==undefined) {
      dt.setHours(time.hour);
      dt.setMinutes(time.minute);
    }
    switch (format) {
      case 0: return {str: dt.toLocaleString().slice(0, -3), num: Number(dt)};
      case 1: return {str: dt.toLocaleTimeString().slice(0, 5), num: Number(dt)};
      case 2: return {str: dt.toLocaleDateString(), num: Number(dt)};
      case 3: return {str: dt.toLocaleDateString().slice(3), num: Number(dt)};
      case 4: return {str: dt.toLocaleDateString().slice(6), num: Number(dt)};
      case 5: return {str: dt.toISOString(), num: Number(dt)};
      //default: return Number(dt);
    }
  }

  const correctStartData = (newValue: Dayjs|null, start: boolean) => {
    let date: { str: string, num: number, }|undefined
    if (newValue!==null) date = dateGen(undefined, undefined, format.iso, newValue.toISOString())
    if ((date!==undefined)&&(startDate!==undefined)&&(endDate!==undefined)) start? setStartDate(endDate.num>date.num ? date : endDate) : setEndDate(startDate.num<date.num ? date : startDate);
  }

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '95vh'}}>
      {ready&&
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <Box sx={{ margin: 1 }}>
            <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
              <InputLabel id="demo-select-small-label">Интерфейс</InputLabel>
              <Select
                labelId="demo-select-small-label"
                id="demo-select-small"
                value={int}
                label="Age"
                onChange={handleChange}
              >
                {statistic.interfaces.map((item: any, index: number)=>{
                  return (
                    <MenuItem value={index} key={item.name}>{item.name}</MenuItem>
                  )
                })}
              </Select>
            </FormControl>
            <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
              <InputLabel id="demo-select-small-label">Период</InputLabel>
              <Select
                labelId="demo-select-small-label"
                id="demo-select-small"
                value={trf}
                label="Age"
                onChange={handleChangeT}
              >
                {Object.keys(statistic.interfaces[int].traffic).map((item: string)=>{
                  return (
                    item!=='total'&&<MenuItem value={item} key={item}>{item}</MenuItem>
                  )
                })}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ margin: 1, display: 'flex' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
              <DateTimePicker 
                label="Начальная дата" 
                value={dayjs(startDate!==undefined?startDate.str:'')}
                onChange={(newValue) => {
                  correctStartData(newValue, true)
                }}
                sx={{ m: 1, minWidth: 120 }}
              />
              <DateTimePicker 
                label="Конечная дата" 
                value={dayjs(endDate!==undefined?endDate.str:'')}
                onChange={(newValue) => {
                  correctStartData(newValue, false)
                }}
                sx={{ m: 1, minWidth: 120 }}
              />
            </LocalizationProvider>
          </Box>   
        </Box>
      }
      <Box sx={{width: width>400?'80%':'100%'}}><Line data={data} /></Box>
      {ready&&<Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Typography sx={{fontSize: 'inherit'}} variant='h6'>Последнее обновление: {statistic.interfaces[int].updated.date.day}.{statistic.interfaces[int].updated.date.month}.{statistic.interfaces[int].updated.date.year}  {statistic.interfaces[int].updated.time.hour}:{statistic.interfaces[int].updated.time.minute}</Typography>
        <Typography sx={{fontSize: 'inherit'}} variant='h6'>Всего: rx: {totalData.rx}, tx: {totalData.tx}</Typography>
      </Box>}  
    </Box>
  )
};

export default App;
