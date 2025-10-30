/* * IMPORTANT: This script block contains all the client-side JavaScript 
 * necessary for navigation, login, and communication with the Code.gs 
 * Apps Script file using google.script.run.
 */

// ------------------------------------------------
// Core GAS Utilities
// ------------------------------------------------

/**
 * Universal failure handler for google.script.run calls.
 */
function onServerFailure(error) {
  console.error("Server-side error:", error);
  alert('Server Error: ' + error.message);
}

/**
 * Generic function to fetch and populate patient dropdowns across the app.
 */
function populatePatientSelects(patients) {
  const selectIds = ['triageSelectPatient', 'consultPatientSelect', 'billPatientSelect'];

  selectIds.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;

    // Clear existing options
    select.innerHTML = '<option value="">-- Select Patient --</option>';

    patients.forEach(patient => {
      const option = document.createElement('option');
      option.value = patient.id; // Use PatientID from the sheet
      option.textContent = `${patient.name} (${patient.id})`;
      select.appendChild(option);
    });
  });
}

/**
 * Renders the Patients List table in the Registration/Dashboard sections.
 */
function updatePatientsList(patients) {
  const tables = {
    dashboardPatientsTable: ['id', 'name', 'age', 'phone'],
    patientsTable: ['id', 'name', 'age', 'phone']
  };

  for (const [tableId, fields] of Object.entries(tables)) {
    const tableElement = document.getElementById(tableId);
    if (!tableElement) continue;

    const tbody = tableElement.querySelector('tbody');
    if (!tbody) continue;

    tbody.innerHTML = '';
    patients.forEach(patient => {
      const row = tbody.insertRow();
      fields.forEach(field => {
        row.insertCell().textContent = patient[field];
      });
      // Add 'Actions' button for the main list
      if (tableId === 'patientsTable') {
        row.insertCell().innerHTML = '<button class="btn" style="background:#ef4444; padding: 4px 8px; font-size: 12px;">Edit</button>';
      }
    });
  }
}


// ------------------------------------------------
// Navigation & Login Logic (Modified for GAS Load)
// ------------------------------------------------

(function(){
  const nav = document.getElementById('nav');
  const sections = document.querySelectorAll('.section');
  const pageTitle = document.getElementById('pageTitle');
  const loginModal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const demoBtn = document.getElementById('demoLogin');
  const logoutBtn = document.getElementById('logoutBtn');
  const openRegistration = document.getElementById('openRegistration');
  const patientForm = document.getElementById('patientForm');
  const saveVitalsBtn = document.getElementById('saveVitals');
  const consultForm = document.getElementById('consultForm');
  const generateBillBtn = document.getElementById('generateBill');
  
  // Simple UI Navigation
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-target]');
    if(!btn) return;
    nav.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.target;
    sections.forEach(s => s.style.display = s.id === target ? '' : 'none');
    pageTitle.textContent = btn.textContent.trim();
    // Reset subtitle for new page
    document.getElementById('pageSubtitle').textContent = {
        'dashboard': 'Quick overview',
        'registration': 'Register new patients',
        'triage': 'Record patient vitals',
        'consultation': 'Doctor\'s notes and diagnosis',
        'lab': 'Manage lab requests',
        'pharmacy': 'Dispense prescriptions',
        'billing': 'Generate invoices',
        'reports': 'System analytics'
    }[target] || '';
  });

  // Login/Logout Logic (Uses localStorage for simulation only)
  function finishLogin(username){
    loginModal.style.display='none';
    localStorage.setItem('hms_session', JSON.stringify({user:username,role: username==='admin' ? 'Admin' : 'Staff'}));
    document.querySelector('.sidebar div:nth-child(2) div').textContent = username;
    // Reload data after successful login
    loadInitialData(); 
  }

  loginForm.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const fd = new FormData(loginForm);
    const u = fd.get('username').trim();
    const p = fd.get('password').trim();
    // hardcoded credentials
    if((u==='admin' && p==='admin123') || (u==='staff' && p==='staff123')){
      finishLogin(u);
    } else {
      alert('Invalid credentials for demo. Use admin/admin123 or staff/staff123');
    }
  });

  demoBtn.addEventListener('click', ()=> finishLogin('staff'));
  
  logoutBtn.addEventListener('click', ()=>{
    localStorage.removeItem('hms_session');
    loginModal.style.display='';
    document.querySelector('#nav button[data-target="dashboard"]').click();
    document.querySelector('.sidebar div:nth-child(2) div').textContent = 'Staff';
  });

  // Quick open registration from dashboard
  openRegistration.addEventListener('click', ()=> {
    document.querySelector('#nav button[data-target="registration"]').click();
  });
  
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('change', (e)=>{
    if(e.target.checked) document.documentElement.style.filter = 'invert(0.98) hue-rotate(180deg)';
    else document.documentElement.style.filter = '';
  });
  
  // Data Loader Function
  function loadInitialData() {
      // Fetch initial patient data from the sheet when the page loads
      google.script.run
          .withFailureHandler(onServerFailure)
          .withSuccessHandler((patients) => {
              updatePatientsList(patients);
              populatePatientSelects(patients);
              // Update dashboard stats (simplified counts)
              document.getElementById('statPatients').textContent = patients.length;
              document.getElementById('statVisits').textContent = patients.length; 
          })
          .getPatients();
  }

  // Check session on load
  window.addEventListener('load', ()=>{
    const s = localStorage.getItem('hms_session');
    if(s){ 
      loginModal.style.display='none'; 
      const u = JSON.parse(s).user; 
      document.querySelector('.sidebar div:nth-child(2) div').textContent = u; 
      loadInitialData(); // Load data if logged in
    } else { 
      loginModal.style.display=''; 
    }
  });
  
  // ------------------------------------------------
  // Form Submission Logic (using google.script.run)
  // ------------------------------------------------

  // 1. Patient Registration Form Handler
  patientForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const formData = Object.fromEntries(new FormData(patientForm).entries());

      google.script.run
          .withFailureHandler(onServerFailure)
          .withSuccessHandler((message) => {
              alert(message);
              patientForm.reset();
              // Refresh lists and dropdowns after successful save
              google.script.run.withSuccessHandler((patients) => {
                  updatePatientsList(patients);
                  populatePatientSelects(patients);
              }).getPatients();
          })
          .savePatient(formData);
  });
  
  // 2. Triage/Vitals Save Handler
  saveVitalsBtn.addEventListener('click', () => {
      const patientId = document.getElementById('triageSelectPatient').value;
      const bp = document.getElementById('bp').value;
      const temp = document.getElementById('temp').value;
      const pulse = document.getElementById('pulse').value;
      const weight = document.getElementById('weight').value;
      const height = document.getElementById('height').value;

      if (!patientId || !bp || !temp || !pulse || !weight || !height) {
          alert('Please fill all vitals fields and select a patient.');
          return;
      }

      google.script.run
          .withFailureHandler(onServerFailure)
          .withSuccessHandler((message) => {
              alert(message);
              // Clear inputs after save
              document.getElementById('bp').value = '';
              document.getElementById('temp').value = '';
              document.getElementById('pulse').value = '';
              document.getElementById('weight').value = '';
              document.getElementById('height').value = '';
          })
          .saveVitals(patientId, bp, temp, pulse, weight, height);
  });
  
  // 3. Consultation Load Triage Button Handler
  document.getElementById('loadTriage').addEventListener('click', () => {
      const patientId = document.getElementById('consultPatientSelect').value;
      if (!patientId) {
          alert('Please select a patient first.');
          return;
      }

      google.script.run
          .withFailureHandler(onServerFailure)
          .withSuccessHandler((vitals) => {
              const preview = document.getElementById('triagePreview');
              if (vitals) {
                  preview.innerHTML = `
                      **Latest Triage:** BP: ${vitals.bp}, Temp: ${vitals.temp}°C, Pulse: ${vitals.pulse}, BMI: ${vitals.bmi}
                  `;
              } else {
                  preview.textContent = 'No vitals found for this patient.';
              }
          })
          .getLatestVitals(patientId);
  });
  
  // 4. Consultation Form Handler
  consultForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const patientId = document.getElementById('consultPatientSelect').value;
      if (!patientId) {
          alert('Please select a patient.');
          return;
      }

      const formData = Object.fromEntries(new FormData(consultForm).entries());
      
      google.script.run
          .withFailureHandler(onServerFailure)
          .withSuccessHandler((message) => {
              alert(message);
              consultForm.reset();
              document.getElementById('triagePreview').textContent = 'Triage details will appear here.';
          })
          .saveConsultation(patientId, formData);
  });
  
  // 5. Billing Generation Handler
  generateBillBtn.addEventListener('click', () => {
      const patientId = document.getElementById('billPatientSelect').value;
      if (!patientId) {
          alert('Please select a patient to generate a bill.');
          return;
      }

      google.script.run
          .withFailureHandler(onServerFailure)
          .withSuccessHandler((result) => {
              alert(result.message);
              const preview = document.getElementById('invoicePreview');
              preview.style.display = 'block';
              
              if (result.invoice) {
                  preview.innerHTML = `
                      <h4>Invoice Preview (${result.invoice.number})</h4>
                      <p>Consultation: KSH ${result.invoice.consult}</p>
                      <p>Lab: KSH ${result.invoice.lab}</p>
                      <p>Pharmacy: KSH ${result.invoice.pharmacy}</p>
                      <hr style="margin: 8px 0;">
                      <p style="font-weight: bold;">TOTAL: KSH ${result.invoice.total}</p>
                  `;
              } else {
                   preview.textContent = result.message;
              }
          })
          .generateBill(patientId);
  });

})();
