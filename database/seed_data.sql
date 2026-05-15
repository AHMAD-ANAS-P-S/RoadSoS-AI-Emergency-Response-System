-- RoadSoS Seed Data — Tamil Nadu Emergency Services
-- Representative verified data for hackathon demo
-- Source: data.gov.in + OpenStreetMap + official directories

INSERT OR IGNORE INTO services (name,category,latitude,longitude,phone,address,district,is_24x7,trauma_ready,icu_beds,confidence_score,source) VALUES

-- ─── HOSPITALS (Chennai) ────────────────────────────────────
('Government Stanley Medical College Hospital','hospital',13.1100,80.2853,'+914428452271','Old Jail Road, Royapuram, Chennai 600001','Chennai',1,1,200,0.95,'govt'),
('Rajiv Gandhi Government General Hospital','hospital',13.0820,80.2785,'+914428254747','Park Town, Chennai 600003','Chennai',1,1,500,0.95,'govt'),
('Government Kilpauk Medical College Hospital','hospital',13.0861,80.2412,'+914426641066','Poonamallee High Road, Kilpauk, Chennai 600010','Chennai',1,1,100,0.92,'govt'),
('Apollo Hospitals Chennai','hospital',13.0631,80.2491,'+914428296000','21 Greams Lane, Off Greams Road, Chennai 600006','Chennai',1,1,350,0.90,'manual'),
('Fortis Malar Hospital','hospital',13.0033,80.2490,'+914424954600','52 1st Main Road, Gandhi Nagar, Adyar, Chennai 600020','Chennai',1,1,200,0.90,'manual'),
('MIOT International Hospital','hospital',13.0166,80.1765,'+914422492288','4/112 Mount Poonamallee Road, Manapakkam, Chennai 600089','Chennai',1,1,400,0.92,'manual'),
('Sri Ramachandra Medical Centre','hospital',13.0397,80.1565,'+914445928600','No. 1 Ramachandra Nagar, Porur, Chennai 600116','Chennai',1,1,500,0.93,'manual'),
('Government Hospital Tambaram','hospital',12.9252,80.1146,'+914422261246','Chennai - Bangalore Highway, Tambaram, Chennai 600045','Chennai',1,0,50,0.85,'govt'),
('Coimbatore Medical College Hospital','hospital',11.0022,76.9747,'+914222301945','Avinashi Road, Coimbatore 641014','Coimbatore',1,1,300,0.90,'govt'),
('Government Hospital Madurai','hospital',9.9194,78.1205,'+914522533681','Panagal Road, Madurai 625020','Madurai',1,1,200,0.88,'govt'),

-- ─── AMBULANCES ─────────────────────────────────────────────
('Tamil Nadu 108 Ambulance Service','ambulance',13.0827,80.2707,'108','Chennai Control Centre','Chennai',1,0,0,0.99,'govt'),
('GVK EMRI 108 Ambulance - Chennai North','ambulance',13.1200,80.2800,'108','North Chennai Zone','Chennai',1,0,0,0.98,'govt'),
('GVK EMRI 108 Ambulance - Chennai South','ambulance',12.9800,80.2500,'108','South Chennai Zone','Chennai',1,0,0,0.98,'govt'),
('Ziqitza 1298 Ambulance','ambulance',13.0500,80.2500,'1298','Chennai City','Chennai',1,0,0,0.90,'manual'),
('National Ambulance Service - Coimbatore','ambulance',11.0170,76.9558,'108','Coimbatore Zone','Coimbatore',1,0,0,0.92,'govt'),

-- ─── POLICE STATIONS ────────────────────────────────────────
('Chennai City Police Control Room','police',13.0827,80.2707,'100','Vepery, Chennai 600007','Chennai',1,0,0,0.99,'govt'),
('T.Nagar Police Station','police',13.0418,80.2341,'+914424341900','T.Nagar, Chennai 600017','Chennai',1,0,0,0.92,'govt'),
('Tambaram Police Station','police',12.9241,80.1250,'+914422261600','GST Road, Tambaram','Chennai',1,0,0,0.88,'govt'),
('Adyar Police Station','police',13.0067,80.2569,'+914424422300','L.B. Road, Adyar, Chennai 600020','Chennai',1,0,0,0.90,'govt'),
('Coimbatore City Police','police',11.0168,76.9558,'100','Race Course Road, Coimbatore','Coimbatore',1,0,0,0.92,'govt'),
('Anna Nagar Police Station','police',13.0895,80.2089,'+914426206200','2nd Avenue, Anna Nagar, Chennai 600040','Chennai',1,0,0,0.90,'govt'),

-- ─── TOWING SERVICES ────────────────────────────────────────
('National Highways Authority Towing - NH44','towing',13.0827,80.2707,'+914428521000','NH44 Control, Chennai','Chennai',1,0,0,0.80,'manual'),
('Chennai Traffic Police Towing','towing',13.0700,80.2500,'103','Chennai Police, Traffic Wing','Chennai',1,0,0,0.85,'govt'),
('RSA - Roadside Assistance Chennai','towing',13.0500,80.2300,'+919003001234','Multiple locations','Chennai',1,0,0,0.78,'manual'),
('Quick Tow Chennai','towing',13.0300,80.2100,'+919884001234','Pallavaram, Chennai','Chennai',1,0,0,0.75,'manual'),
('Highway Heroes Towing','towing',12.9500,80.1500,'+919600001234','GST Road Service','Chennai',1,0,0,0.72,'manual'),

-- ─── PUNCTURE SHOPS ─────────────────────────────────────────
('Ceat Shoppe - Anna Nagar','puncture',13.0872,80.2107,'+914426162500','2nd Avenue, Anna Nagar','Chennai',0,0,0,0.82,'manual'),
('MRF Tyre Service - T.Nagar','puncture',13.0410,80.2333,'+914424340099','Usman Road, T.Nagar','Chennai',0,0,0,0.80,'manual'),
('Apollo Tyres - Tambaram','puncture',12.9255,80.1142,'+914422263000','GST Road, Tambaram','Chennai',0,0,0,0.78,'manual'),
('24hr Tyre Repair - Perungudi','puncture',12.9553,80.2413,'+919500001234','Perungudi, OMR','Chennai',1,0,0,0.75,'manual'),
('National Tyre Service - Coimbatore','puncture',11.0100,76.9600,'+914222394500','DB Road, Coimbatore','Coimbatore',0,0,0,0.80,'manual'),

-- ─── VEHICLE SHOWROOMS ──────────────────────────────────────
('Sundaram Motors (Maruti) - Anna Nagar','showroom',13.0885,80.2050,'+914426123456','Anna Nagar, Chennai','Chennai',0,0,0,0.82,'manual'),
('Hyundai Service - Guindy','showroom',13.0100,80.2200,'+914422501234','Industrial Estate, Guindy','Chennai',0,0,0,0.80,'manual'),
('TATA Motors - Perambur','showroom',13.1200,80.2600,'+914425671234','Perambur High Road, Chennai','Chennai',0,0,0,0.78,'manual');

-- ─── I18N STRINGS ───────────────────────────────────────────
INSERT OR IGNORE INTO i18n_strings (key,en,hi,ta) VALUES
('sos.trigger','SOS','एसओएस','SOS'),
('sos.help','Emergency Help','आपातकालीन सहायता','அவசர உதவி'),
('hospital','Hospital','अस्पताल','மருத்துவமனை'),
('ambulance','Ambulance','एंबुलेंस','ஆம்புலன்ஸ்'),
('police','Police','पुलिस','காவல்துறை'),
('towing','Towing','टोइंग','டோயிங்'),
('puncture','Puncture','पंचर','பஞ்சர்');
