document.addEventListener('DOMContentLoaded', function() {
  const statusElement = document.getElementById('status');
  const qrContainer = document.getElementById('qr-container');
  const qrCodeElement = document.getElementById('qr-code');
  const startBtn = document.getElementById('startBtn');
  const spinner = document.getElementById('spinner');
  const form = document.getElementById('campaignForm');

  // 1. Verificar estado inicial
  checkWhatsAppStatus();

  // 2. Configurar EventSource para actualizaciones en tiempo real
  const eventSource = new EventSource('/api/whatsapp-events');
  
  eventSource.addEventListener('status_change', function(e) {
    const data = JSON.parse(e.data);
    updateStatus(data.status);
    
    if (data.status === 'disconnected' && data.qr) {
      showQR(data.qr);
    }
  });

  eventSource.addEventListener('error', function() {
    console.log('Error en la conexión SSE');
    eventSource.close();
    setTimeout(() => checkWhatsAppStatus(), 5000);
  });

  // 3. Manejar envío del formulario
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    startBtn.disabled = true;
    spinner.classList.remove('d-none');
    
    try {
      const response = await fetch('/api/start-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: document.getElementById('phone').value,
          message: document.getElementById('message').value
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('¡Mensaje enviado correctamente!');
      } else {
        alert(`Error: ${result.error}`);
        if (result.requiresQR) {
          checkWhatsAppStatus();
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión con el servidor');
    } finally {
      startBtn.disabled = false;
      spinner.classList.add('d-none');
    }
  });

  // Funciones auxiliares
  function updateStatus(status) {
    statusElement.textContent = status === 'connected' ? 'Conectado' : 'Desconectado';
    statusElement.className = status === 'connected' ? 'status-connected' : 'status-disconnected';
    startBtn.disabled = status !== 'connected';
  }

  function showQR(qrData) {
    qrContainer.classList.remove('d-none');
    qrCodeElement.innerHTML = '';
    new QRCode(qrCodeElement, qrData);
  }

  async function checkWhatsAppStatus() {
    try {
      const response = await fetch('/api/whatsapp-status');
      const data = await response.json();
      updateStatus(data.status);
      
      if (data.qr) {
        showQR(data.qr);
      }
    } catch (error) {
      console.error('Error al verificar estado:', error);
    }
  }
});