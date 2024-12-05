import React, { useEffect, useState } from "react";
import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Button, Box, TextField, Paper, Typography, Grid, Badge, Dialog, DialogTitle, DialogContent, 
    DialogActions, IconButton, Card, CardContent, CardActions, Tabs, Tab} from '@mui/material';
import api from "../api";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { DateCalendar} from '@mui/x-date-pickers/DateCalendar';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import 'react-calendar/dist/Calendar.css'; // Import the calendar styles
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import 'dayjs/locale/es';
import { TimePicker } from "@mui/x-date-pickers";
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import { Entry } from "../interfaces/Entry";
import { Diary } from "../interfaces/Diary";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

function TabPanel(props:any) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && 
                <Grid container display="flex" 
                flexDirection="column" 
                justifyContent="start"
                alignItems="center"
                sx={{width: "95vw", maxWidth:"500px", flexWrap: "wrap", gap:2}}
                >{children}</Grid>}
        </div>
    );
}

function getHighlightedDays(entries: Entry[], currentMonth: Dayjs | null) {
    console.log("currentMonth: ", currentMonth?.month())
    if (currentMonth){
        return entries
        .filter(entry => dayjs(entry.date).month() === currentMonth.month())
        .map(entry => dayjs(entry.date).date());
    }
    return []
    
  }

  function EntryDay(props: PickersDayProps<Dayjs> & { highlightedDays?: number[] }) {
    const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  
    const isHighlighted =
      !outsideCurrentMonth && highlightedDays.indexOf(day.date()) >= 0;
  
    return (
      <Badge
        key={day.toString()}
        overlap="circular"
        badgeContent={isHighlighted ? '📌' : undefined}
        sx={{ position: 'relative' }}
      >
        <PickersDay outsideCurrentMonth={outsideCurrentMonth} {...other} day={day} />
      </Badge>
    );
  }

  const AddEntryForm: React.FC<{ diaryId:string|undefined, selectedDate: Dayjs
                                onClose: () => void,
                                setEntries: React.Dispatch<React.SetStateAction<any[]>>}> 
   = ({ selectedDate, onClose, diaryId, setEntries }) => {
    const [entryTitle, setEntryTitle] = useState('');
    const [entryNotes, setEntryNotes] = useState('');
    const [selectedTime, setSelectedTime] = useState<Dayjs|null>(dayjs());
    const token = window.sessionStorage.getItem("token") || window.localStorage.getItem("token")
    const currentUserId = window.sessionStorage.getItem("id") || window.localStorage.getItem("id")
    const entriesURL = `/food-diary/byid/${diaryId}/entries`
  
    const handleAddEntry = () => {
        if (!entryTitle) return; // Prevent creating empty entries
        
    const entryDueDateTime = selectedDate
        .hour(selectedTime?.hour() || 0)
        .minute(selectedTime?.minute() || 0);

    const formattedTime = entryDueDateTime.format('hh:mm A'); // Adjust format as needed
    const newEntryTitle = `${entryTitle} - ${formattedTime}`; // Append time to entry title
    
    const newEntry = {
        title: newEntryTitle,
        content: entryNotes,
        date: entryDueDateTime.toISOString(), // Set date date to the selected date
    };
  
      // API call to add entry
      api.post(
        `${entriesURL}`,
        newEntry,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
        .then((response) => {
          console.log('Entry created:', response.data);
          // Update local entries state
            setEntries((prevEntrys) => [...(prevEntrys || []), 
            { ...response.data }]); // Ensure to add entry with new id

          onClose();  // Close the dialog after entry creation
        })
        .catch((error) => console.log(error));
    };
  
    return (
      <Dialog open={true} onClose={onClose}>
        <DialogTitle>Agregar registro en {selectedDate.format('DD/MM/YYYY')}</DialogTitle>
        <DialogContent>
          <Grid container direction="column" gap={2}>
            <TextField
              label="Título"
              value={entryTitle}
              onChange={(e) => {
                const inputValue = e.target.value;
                // Remove "-" characters from the input
                const sanitizedValue = inputValue.replace(/-/g, ','); 
                setEntryTitle(sanitizedValue);
                }}
              variant="outlined"
              sx={{mt: 2}}
            />
            <TextField
              label="Detalles"
              value={entryNotes}
              onChange={(e) => setEntryNotes(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                label="Hora"
                value={selectedTime}
                onChange={(newTime) => setSelectedTime(newTime)}
                />
            </LocalizationProvider>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Salir</Button>
          <Button onClick={handleAddEntry} color="primary" variant="contained">Agregar registro</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const EditEntryForm: React.FC<{ diaryId:string | undefined, selectedDate: Dayjs, entry: Entry,
                                onClose: () => void,
                                setEntries: React.Dispatch<React.SetStateAction<any[]>>}> 
   = ({ selectedDate, onClose, diaryId, setEntries, entry }) => {
    const [entryTitle, setEntryTitle] = useState(entry.title.split(" -")[0]);
    const [entryNotes, setEntryNotes] = useState(entry.content);
    const [selectedTime, setSelectedTime] = useState<Dayjs|null>(dayjs());
    const entriesURL = `/food-diary/byid/${diaryId}/entries/${entry.id}`
    const token = window.sessionStorage.getItem("token") || window.localStorage.getItem("token")
  
    const handleEditEntry = () => {
        if (!entryTitle) return; // Prevent creating empty entries
        if (entryTitle === entry.title.split(" -")[0] && entryNotes === entry.content){
            console.log(entryTitle, entry.title.split(" -")[0])
            return
        } 
        const entryDueDateTime = selectedDate
            .hour(selectedTime?.hour() || 0)
            .minute(selectedTime?.minute() || 0);

        const formattedTime = entryDueDateTime.format('hh:mm A'); // Adjust format as needed
        const newEntryTitle = `${entryTitle} - ${formattedTime}`; // Append time to entry title
        
        const newEntry = {
            title: newEntryTitle,
            content: entryNotes,
            date: entryDueDateTime.toISOString(), // Set date date to the selected date
        };
        console.log("newEntry: ", newEntry)
        // API call to add entry
        api.patch(
            `${entriesURL}`,
            newEntry,
            {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            }
        )
            .then((response) => {
            console.log('Entry updated:', response.data);
            // Update local entries state
                setEntries((prevEntrys) => prevEntrys.map((t) => 
                    t.id === entry.id 
                        ? {
                            ...response.data,
                        }
                        : t // Keep the other entries unchanged
                ))

            onClose();  // Close the dialog after entry creation
            })
            .catch((error) => console.log(error));
    };
  
    return (
      <Dialog open={true} onClose={onClose}>
        <DialogTitle>Editar registro en {selectedDate.format('DD/MM/YYYY')}</DialogTitle>
        <DialogContent>
          <Grid container direction="column" gap={2}>
            <TextField
              label="Título"
              value={entryTitle}
              onChange={(e) => {
                const inputValue = e.target.value;
                // Remove "-" characters from the input
                const sanitizedValue = inputValue.replace(/-/g, ','); 
                setEntryTitle(sanitizedValue);
                }}
              variant="outlined"
              sx={{mt:2}}
            />
            <TextField
              label="Detalles"
              value={entryNotes}
              onChange={(e) => setEntryNotes(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                label="Hora"
                value={selectedTime}
                onChange={(newTime) => setSelectedTime(newTime)}
                />
            </LocalizationProvider>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Salir</Button>
          <Button onClick={handleEditEntry} color="primary" variant="contained">Modificar registro</Button>
        </DialogActions>
      </Dialog>
    );
  };

const FoodDiaryLocal: React.FC = () => {
    const token = window.sessionStorage.getItem("token") || window.localStorage.getItem("token")
    const currentUserId = window.sessionStorage.getItem("id") || window.localStorage.getItem("id")
    const [selectedTab, setSelectedTab] = useState(0); // 0 for Diaries, 1 for Entries
    const [diaries, setDiaries] = useState<Diary[]>([])
    const [selectedDiary, setSelectedDiary] = useState<Diary|null>(null);
    const [diaryToEdit, setDiaryToEdit] = useState<Diary | null>(null)
    // const [highlightedDays, setHighlightedDays] = useState<number[]>([]);
    const [entries, setEntries] = useState<Entry[]>([])
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
    const [isEditEntryOpen, setIsEditEntryOpen] = useState(false)
    const [isDeleteEntryOpen, setIsDeleteEntryOpen] = useState(false)
    const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
    // const [loadingDiaries, setLoadingDiaries] = useState(true);
    const [newDiaryTitle, setNewDiaryTitle] = useState<string>('')
    const [newDiaryDescription, setNewDiaryDescription] = useState<string>('')
    const [openNewDiarydialog, setOpenNewDiaryDialog] = useState(false)
    const [openDeleteDiaryDialog, setOpenDeleteDiaryDialog] = useState(false)
    const [openEditDiarydialog, setOpenEditDiaryDialog] = useState(false)
    const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null);
    const diariesURL = "/food-diary"

    useEffect(()=>{
        setSelectedDate(dayjs())
        // let queryParams = `?u=${currentUserId}&we=true`
        api.get(`${diariesURL}/byUser/${currentUserId}`, 
            {
                withCredentials: true,
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        )
        .then(res => {
            setDiaries(res.data)
        })
        .catch(error=>{
            console.log(error)
        })
        // .finally(()=>{
        //     setLoadingDiaries(false)
        // })
    },[])

    useEffect(()=>{
        let date = selectedDate
        const entriesForDate = entries?.filter((entry: Entry) => 
            {   
                if (entry.date){
                    const entryDate = dayjs(entry.date).format("DD/MM/YYYY"); 
                    // Format selected date to yyyy-mm-dd
                    const selectedFormattedDate = dayjs(date).format("DD/MM/YYYY");
                    console.log("2: ", entryDate, selectedFormattedDate)
                    return entryDate === selectedFormattedDate;
                }
            }
        );
        setFilteredEntries(entriesForDate || []);
    },[entries])

    const handleTabChange = (event:any, newValue:number) => {
        setSelectedTab(newValue);
    };

    const handleSelectDiary = (diary:Diary) => {
        console.log("diario: ", diary)
        setSelectedDiary(diary)
        setEntries(diary.diaryEntry)
        // setHighlightedDays(getHighlightedDays(diary.diaryEntry, selectedDate)); 
        setSelectedTab(1);
    }

    const handleCreateDiary = () => {
        const newDiary = {
            title: newDiaryTitle,
            description: newDiaryDescription,
            userId: currentUserId
        }
        api.post(diariesURL, newDiary,
            {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
            }
        )
        .then(res => {
            setDiaries(prevDiaries => [...prevDiaries, res.data])
        })
        .catch(error => {
            console.log(error)
        })
        .finally(()=>{
            closeCreateDiaryDialog()
        })
    }

    const handleEditDiary = () => {
        const newDiary = {
            title: newDiaryTitle,
            description: newDiaryDescription,
        }
        api.patch(`${diariesURL}/byid/${diaryToEdit?.id}`, newDiary,
            {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
            }
        )
        .then(res => {
            setDiaries((prevDiaries) => 
                prevDiaries.map((diary)=>
                diary.id === res.data.id ? res.data : diary
                )
            )
        })
        .catch(error => {
            console.log(error)
        })
        .finally(()=>{
            closeEditDiary()
        })
    }

    const handleDeleteDiary = () => {
        api.delete(`${diariesURL}/byid/${diaryToEdit?.id}`,
            {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
            }
        )
        .then(res => {
            setDiaries((prevDiaries) => 
                prevDiaries.filter((diary)=>
                diary.id !== diaryToEdit?.id
                )
            )
        })
        .catch(error => {
            console.log(error)
        })
        .finally(()=>{
            closeDeleteDiary()
        })
    }

    const handleDeleteEntry = () => {
        api.delete(`${diariesURL}/byid/${diaryToEdit?.id}/entries/${entryToEdit?.id}`,
            {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
            }
        )
        .then(res => {
            setEntries((prevEntrys) => 
                prevEntrys.filter((t) => 
                    t.id !== entryToEdit?.id 
                )
            )
        })
        .catch(error => {
            console.log(error)
        })
        .finally(()=>{
            closeDeleteEntryDialog()
        })
    }

    const handleDateClick = (date: Dayjs) => {
        setSelectedDate(date);
        const entriesForDate = entries?.filter((entry: any) => 
            {   
                if (entry.date){
                    const entryDueDate = dayjs(entry.date).format("DD/MM/YYYY"); 
                    // Format selected date to yyyy-mm-dd
                    const selectedFormattedDate = dayjs(date).format("DD/MM/YYYY");
                    console.log("hola", entryDueDate, selectedFormattedDate)
                    return entryDueDate === selectedFormattedDate;
                }
                return false;
            }
        );
        setFilteredEntries(entriesForDate || []);
    };

    const generatePDF = (entryListTitle: string, entries: any[], userName: string) => {
        const doc = new jsPDF();
      
        doc.text(`Diario alimenticio: ${entryListTitle}`, 10, 10);
        doc.text(`Usuario: ${userName}`, 10, 20);

        const entriesByDay: { [key: string]: Entry[] } = entries.reduce((acc: { [key: string]: Entry[] }, entry: Entry) => {
            const entryDate = dayjs(entry.date).format('YYYY-MM-DD');
            if (!acc[entryDate]) {
                acc[entryDate] = [];
            }
            acc[entryDate].push(entry);
            return acc;
        }, {});
    
    
        // Sort keys (dates) chronologically
        const sortedDates = Object.keys(entriesByDay).sort((a, b) => dayjs(a).diff(dayjs(b)));
      
        const tableData: any[] = sortedDates.reduce((acc: any[], date: string) => {
            const entriesForDate = entriesByDay[date];
            entriesForDate.forEach(entry => {
                acc.push([
                    dayjs(date).format('DD/MM/YYYY'), // Date column
                    entry.title, // Entry column (entry title)
                    entry.content
                ]);
            });
            return acc;
        }, []);

        autoTable(doc, {
            head: [['Fecha', 'Registro', 'Detalles']], // Table headers
            body: tableData, // Table body
            startY: 30, // Start position
            styles: {
                cellPadding: 3,
                fontSize: 10,
            },
            headStyles: {
                fillColor: [22, 160, 133], // Header color
            },
            columnStyles: {
                0: { cellWidth: 40 }, // Date column width
                1: { cellWidth: 70 }, // Entry column width
                2: { cellWidth: 70 }, // Details column width
            }
        });

        doc.save(`${entryListTitle}.pdf`);
      };
      
      // Call this function when needed
      const handleDownloadPDF = () => {
        if (selectedDiary){
            const userName = sessionStorage.getItem('name') || localStorage.getItem('name');
            generatePDF(selectedDiary?.title, entries, userName || 'Desconocido');
        }
        
      };

    const openCreateDiaryDialog = () => {
        setOpenNewDiaryDialog(true);
    };
    
    const closeCreateDiaryDialog = () => {
        setOpenNewDiaryDialog(false);
        setNewDiaryDescription("")
        setNewDiaryTitle("")
    };

    const openDeleteDiary = (diary:Diary) =>{
        setDiaryToEdit(diary)
        setOpenDeleteDiaryDialog(true)
    }

    const closeDeleteDiary = () =>{
        setDiaryToEdit(null)
        setOpenDeleteDiaryDialog(false)
    }

    const openEditDiary = (diary:Diary) =>{
        setDiaryToEdit(diary)
        setNewDiaryTitle(diary.title)
        setNewDiaryDescription(diary.description)
        setOpenEditDiaryDialog(true)
    }

    const closeEditDiary = () =>{
        setDiaryToEdit(null)
        setNewDiaryTitle("")
        setNewDiaryDescription("")
        setOpenEditDiaryDialog(false)
    }

    const openAddEntryDialog = () => {
        setIsAddEntryOpen(true);
    };
    
    const closeAddEntryDialog = () => {
        setIsAddEntryOpen(false);
    };

    const openEditEntryDialog = (entry:Entry) => {
        setEntryToEdit(entry); 
        setIsEditEntryOpen(true);
    };

    const openDeleteEntryDialog = (entry:Entry) => {
        setEntryToEdit(entry); 
        setIsDeleteEntryOpen(true);
    };
    
    const closeEditEntryDialog = () => {
        setIsEditEntryOpen(false);
    };

    const closeDeleteEntryDialog = () => {
        setIsDeleteEntryOpen(false);
    };

    const handleMonthChange = (date: Dayjs) => {
        setSelectedDate(date.startOf('month'));
        // Update highlightedDays based on the new month
        // ...
      };

    return ( 
        <>
        <Tabs value={selectedTab} onChange={handleTabChange} centered sx={{maxWidth:"95vw", mb:1}}>
            <Tab label="Diarios" />
            <Tab label="Registros" disabled={!selectedDiary} /> {/* Disable until a diary is selected */}
        </Tabs>
        <TabPanel value={selectedTab} index={0}>
        {/* Diaries Tab */}
            {diaries.map(diary=> {
                return (
                    <>
                    <Card key={diary.id} sx={{
                    border: "4px solid", 
                    borderColor: "primary.dark", 
                    bgcolor: "primary.contrastText",
                    width:"90%", 
                    height: "15vh",
                    maxHeight: "100px", 
                    minHeight: "40px",
                    display:"flex",
                    }}>
                        <CardContent sx={{
                        width:"80%",
                        height: "100%", 
                        display:"flex", 
                        flexDirection: "row", 
                        justifyContent: "center",
                        alignItems: "center",
                        padding:0,
                        }}>
                            <Box sx={{
                            width:"100%", 
                            height: "100%",
                            display:"flex", 
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            }}>
                            <Typography 
                                variant="h6" 
                                color="secondary.contrastText" 
                                width="100%" 
                                sx={{alignContent:"center", 
                                    borderBottom: "2px solid", 
                                    borderColor: "primary.main", 
                                    bgcolor: "secondary.main"}}
                                >
                                {diary.title}
                            </Typography>
                            <Typography 
                            variant='subtitle2' 
                            color= "primary.dark" 
                            width="100%"
                            height="100%"
                            sx={{
                                textAlign:"center", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                display: "flex", 
                                gap:1,
                                height: "100%",
                                bgcolor: "primary.contrastText"
                            }}>
                                {diary.description}
                            </Typography>
                            <Box sx={{
                                width:"100%", 
                                display:"flex", 
                                flexDirection: "column",
                                justifyContent: "center",
                                bgcolor: "secondary.main"
                            }}>     
                            </Box>
                                
                        </Box>
                        </CardContent>
                        <CardActions sx={{padding:0, width:"20%"}}>
                        <Box sx={{
                            width:"100%", 
                            display:"flex", 
                            height: "100%",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            bgcolor: "primary.dark",
                            }}>
                                <IconButton onClick={()=>openDeleteDiary(diary)}>
                                    <DeleteForeverRoundedIcon
                                    sx={{
                                        color:"error.main", 
                                        fontSize: {
                                            xs: 18,   // font size for extra small screens (mobile)
                                            sm: 24,   // font size for large screens (desktops)
                                        }
                                    }}/>
                                </IconButton>
                                <IconButton onClick={()=>openEditDiary(diary)}>
                                    <EditIcon 
                                    sx={{
                                        color:"primary.contrastText", 
                                        fontSize: {
                                            xs: 18,   // font size for extra small screens (mobile)
                                            sm: 24,   // font size for large screens (desktops)
                                        }
                                    }}/>
                                </IconButton>
                                <Button onClick={()=>handleSelectDiary(diary)}
                                variant='text' 
                                sx={{color: "secondary.main", 
                                    fontSize: {
                                        xs: 12,   // font size for extra small screens (mobile)
                                        sm: 16,   // font size for large screens (desktops)
                                    }, 
                                    padding:0
                                }}>
                                    Ver más
                                </Button>
                                
                            </Box>
                        </CardActions>
                    </Card> 
                    <Button onClick={openCreateDiaryDialog}
                    variant="dark" 
                    sx={{
                        display: "flex",
                        position: 'fixed',
                        bottom: 0, // 16px from the bottom
                        zIndex: 100, // High zIndex to ensure it's on top of everything
                        height: "48px",
                        width: "100%",
                        maxWidth: "500px"
                    }}
                    >
                        <AddIcon sx={{fontSize: 40}}></AddIcon>
                        <Typography variant='subtitle1' color={"inherit"}>
                            Crear diario alimenticio
                        </Typography>
                        
                    </Button>
                    
                    
                    </>
                )
            })}
            <Dialog open={openNewDiarydialog} onClose={closeCreateDiaryDialog}
            PaperProps={{
                sx: {
                    maxHeight: '80vh', 
                    width: "85vw",
                    maxWidth: "450px"
                }
            }} >
                <DialogTitle>Nuevo diario alimenticio</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Título"
                        value={newDiaryTitle}
                        onChange={(e) => setNewDiaryTitle(e.target.value)}
                        variant="outlined"
                        sx={{my:1}}
                    />
                    <TextField
                        label="Descripción"
                        multiline
                        rows={2}
                        maxRows={2}
                        value={newDiaryDescription}
                        onChange={(e) => setNewDiaryDescription(e.target.value)}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeCreateDiaryDialog} variant="text">Salir</Button>
                    <Button onClick={handleCreateDiary} disabled={newDiaryTitle===""} color="primary" variant="contained">Agregar diario</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={openEditDiarydialog} onClose={closeEditDiary}
            PaperProps={{
                sx: {
                    maxHeight: '80vh', 
                    width: "85vw",
                    maxWidth: "450px"
                }
            }} >
                <DialogTitle>Editar diario {diaryToEdit?.title}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Título"
                        value={newDiaryTitle}
                        onChange={(e) => setNewDiaryTitle(e.target.value)}
                        variant="outlined"
                        sx={{my:1}}
                    />
                    <TextField
                        label="Descripción"
                        multiline
                        rows={2}
                        maxRows={2}
                        value={newDiaryDescription}
                        onChange={(e) => setNewDiaryDescription(e.target.value)}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeEditDiary} variant="text">Salir</Button>
                    <Button onClick={handleEditDiary} disabled={newDiaryTitle===""} color="primary" variant="contained">Guardar</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={openDeleteDiaryDialog} onClose={closeDeleteDiary}
            PaperProps={{
                sx: {
                    maxHeight: '80vh', 
                    width: "85vw",
                    maxWidth: "450px"
                }
            }} >
                <DialogTitle>Eliminar diario {diaryToEdit?.title}</DialogTitle>
                <DialogContent>
                    ¿Seguro que desea eliminar el diario {diaryToEdit?.title}?
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDeleteDiary} variant="text">Salir</Button>
                    <Button onClick={handleDeleteDiary} color="primary" variant="contained">Borrar</Button>
                </DialogActions>
            </Dialog>
            </TabPanel>

            <TabPanel value={selectedTab} index={1}>
            {selectedDiary && (
            <>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
            <Box sx={{display:"flex", flexDirection: "column", alignItems: "center", gap:1, justifyContent: "center", width:"100%"}}>
                <Typography variant="h6">
                    {selectedDiary.title}
                </Typography>
                <Button variant="inverted" onClick={handleDownloadPDF} sx={{gap:1}}>
                    <PictureAsPdfIcon sx={{fontSize:18}}/>
                    <Typography variant="subtitle1">
                        Descargar
                    </Typography>
                </Button>
            </Box>
               <DateCalendar
                    value={selectedDate}
                    renderLoading={() => <DayCalendarSkeleton />}
                    onMonthChange={handleMonthChange}
                    onChange={(newValue) => handleDateClick(newValue)}
                    slots={{
                    day: EntryDay,
                    }}
                    slotProps={{
                    day: {
                        highlightedDays: getHighlightedDays(entries || [], selectedDate)
                    } as any,
                    }}
                />
                <Box sx={{mb:6, gap:1, width: "100%"}}>
                {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry: any) => (
                        <Box key={entry.id} sx={{ border: "5px solid", borderColor: "primary.main", width: "90%", my:1 }}>
                            <Paper elevation={0} square={true} sx={{ bgcolor: "primary.main", color: "primary.contrastText", justifyContent: "space-between", alignItems: "center", display: "flex", px: 1, pb: "5px" }}>
                                <Typography variant='h6' color="primary.contrastText">{entry.title}</Typography>
                                <Box sx={{display: "flex", flexDirection: "row", gap:1}}>
                                    <IconButton
                                        onClick={() => openEditEntryDialog(entry)}
                                        sx={{
                                            padding:0.2, 
                                            display: "flex",
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            height: "100%"
                                        }}
                                    >
                                        <EditIcon sx={{color: 'primary.contrastText', height: "24px", width: "24px" }}/>
                                    </IconButton>
                                    <IconButton
                                        onClick={() => openDeleteEntryDialog(entry)}
                                        sx={{
                                            padding:0.2, 
                                            color: "warning.main", 
                                            display: "flex",
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            height: "100%"
                                        }}
                                    >
                                        <DeleteForeverRoundedIcon sx={{color: 'error.main', height: "24px", width: "24px" }}/>
                                    </IconButton>
                                </Box>
                                {/* Add Entry Dialog */}
                                {isEditEntryOpen && selectedDate && entryToEdit && (
                                    <EditEntryForm setEntries={setEntries} diaryId={selectedDiary?.id} selectedDate={selectedDate} onClose={closeEditEntryDialog} entry = {entryToEdit}/>
                                )}
                            </Paper>
                            {entry.content && 
                            <Paper elevation={0}>
                                {entry.content.split("\n").map((note: string, i:number) => (
                                    <Typography key={i} variant='subtitle1' color="primary.dark" textAlign={"left"} sx={{ my: 1, ml: 1 }}>
                                        - {note}
                                    </Typography>
                                ))}
                            </Paper>
                            }
                        </Box>
                    ))
                ) : (
                    <Typography variant="subtitle2">No hay registros en la fecha seleccionada</Typography>
                )}
                <Dialog open={isDeleteEntryOpen} onClose={closeDeleteEntryDialog}>
                    <DialogTitle>Eliminar registro: {entryToEdit?.title}</DialogTitle>
                    <DialogContent>
                        <Typography>
                            ¿Seguro que desea eliminar el registro {entryToEdit?.title}?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                    <Button onClick={closeDeleteEntryDialog} color="secondary">Cancelar</Button>
                    <Button onClick={handleDeleteEntry} color="primary" variant="contained">Aceptar</Button>
                    </DialogActions>
                </Dialog>
                </Box>
                <Button onClick={openAddEntryDialog}
                variant="dark" 
                sx={{
                    display: "flex",
                    position: 'fixed',
                    bottom: 0, // 16px from the bottom
                    zIndex: 100, // High zIndex to ensure it's on top of everything
                    height: "48px",
                    width: "100%",
                    maxWidth: "500px"
                }}
                >
                    <AddIcon sx={{fontSize: 40}}></AddIcon>
                    <Typography variant='subtitle1' color={"inherit"}>
                        Agregar registro en {selectedDate?.format('DD/MM/YYYY')}
                    </Typography>
                    
                </Button>

                {/* Add Entry Dialog */}
                {isAddEntryOpen && selectedDate && (
                    <AddEntryForm setEntries={setEntries} diaryId={selectedDiary?.id} selectedDate={selectedDate} onClose={closeAddEntryDialog} />
                )}
                </LocalizationProvider>
            </>
            
        )}
        </TabPanel>
        </>
    )
}

export default FoodDiaryLocal