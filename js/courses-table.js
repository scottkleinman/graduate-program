document$.subscribe(function () {
  var target = document.getElementById("courses-table")
  if (!target) {
    return
  }

  var config = document.getElementById("courses-config")
  var semesterId = config ? config.dataset.semesterId : null

  if (!semesterId) {
    target.innerHTML = "<p>Course schedule data not configured.</p>"
    return
  }

  if (typeof schedules === "undefined" || !schedules[semesterId]) {
    target.innerHTML = "<p>Course schedule data not found.</p>"
    return
  }

  var courses = schedules[semesterId].courses
  var rows = courses
    .map(function (course) {
      return (
        "<tr>" +
        "<td>" + course.name + "</td>" +
        "<td>" + course.day + "</td>" +
        "<td>" + course.time + "</td>" +
        "<td>" + course.instructor + "</td>" +
        "</tr>"
      )
    })
    .join("")

  target.innerHTML =
    "<table>" +
    "<thead>" +
    "<tr>" +
    "<th>Course Name</th>" +
    "<th>Day</th>" +
    "<th>Time</th>" +
    "<th>Instructor</th>" +
    "</tr>" +
    "</thead>" +
    "<tbody>" +
    rows +
    "</tbody>" +
    "</table>"

  var table = target.querySelector("table")
  if (table && typeof Tablesort !== "undefined") {
    new Tablesort(table)
  }
})
