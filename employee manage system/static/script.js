// Real-time search/filter for the employees table
document.addEventListener('DOMContentLoaded', function () {
  const searchBox = document.getElementById('searchBox');
  const table = document.getElementById('employeesTable');
  const deptFilter = document.getElementById('departmentFilter');

  function filterTable() {
    const q = (searchBox.value || '').toLowerCase();
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(r => {
      const name = (r.querySelector('.emp-name')?.textContent || '').toLowerCase();
      const email = (r.querySelector('.emp-email')?.textContent || '').toLowerCase();
      const dept = (r.querySelector('.emp-dept')?.textContent || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q) || dept.includes(q);
      const selectedDept = (deptFilter && deptFilter.value) ? deptFilter.value.toLowerCase() : 'all';
      const matchesDept = selectedDept === 'all' || dept === selectedDept.toLowerCase();
      r.style.display = (matchesSearch && matchesDept) ? '' : 'none';
    });
  }

  if (searchBox) searchBox.addEventListener('input', filterTable);
  if (deptFilter) deptFilter.addEventListener('change', function () {
    // change triggers server-side filtering by reloading with query param
    const val = deptFilter.value;
    const params = new URLSearchParams(window.location.search);
    if (val && val !== 'All') params.set('department', val); else params.delete('department');
    if (searchBox && searchBox.value) params.set('search', searchBox.value); else params.delete('search');
    window.location.search = params.toString();
  });

  // run initial filter (useful after server-side search)
  filterTable();
});

function confirmDelete(id) {
  if (confirm('Are you sure you want to delete this employee?')) {
    const form = document.getElementById('delForm' + id);
    if (form) form.submit();
  }
}
