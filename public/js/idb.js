const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db; 
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_budget_data', { autoIncrement: true });
};
 
request.onsuccess = function(event) { 
    db = event.target.result;
    if (navigator.onLine) {
      uploadTransaction();
    }
  };
  
request.onerror = function(event) {
console.log(event.target.errorCode);
};


function saveRecord(record) { 
    const transaction = db.transaction(['new_budget_data'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_budget_data');
    budgetObjectStore.add(record);
};
 
function uploadTransaction() {
    const transaction = db.transaction(['new_budget_data'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_budget_data');
    const getAll = budgetObjectStore.getAll();
  
    getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(['new_budget_data'], 'readwrite');
          const budgetObjectStore = transaction.objectStore('new_budget_data');
          budgetObjectStore.clear();

          alert('All transactions have been submitted');
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
}

window.addEventListener('online', uploadTransaction);