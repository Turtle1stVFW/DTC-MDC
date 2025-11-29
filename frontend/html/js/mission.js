// ------------------------------------------------------------
// Mission Autocomplete + Load/Save (original intact)
// ------------------------------------------------------------

$(document).on('flight-airframe-changed', function (e) {

  var route = $('#flight-airframe').data('route');
  if (!route) { return }

  if (!route.route_only && route.xml_format == "cf" && !$('#mission-id').val()) {
    $('#mission-id').val(route.xml.querySelector('MSNnumber').textContent);
  }

});

$('#mission-callsign').autocomplete({
  source: function (request, response) {
    var mission = $('#data-mission').val();
    response(match_item_in_arr(squadron_data.callsigns ? squadron_data.callsigns : [], request.term))
  },
  minLength: 1,
});

function mission_export() {
  var data = get_form_data($("#mission-form"));
  data['mission-pri-freq'] = freq_to_obj(data['mission-pri-freq']);
  data['mission-sec-freq'] = freq_to_obj(data['mission-sec-freq']);
  data['mission-ter-freq'] = freq_to_obj(data['mission-ter-freq']);
  data['mission-beacons'] = mission_data.data.beacons;
  return data;
}

function mission_load(data, callback) {
  if (!data) { callback(); return; }

  for (const [key, value] of Object.entries(data)) {
    var input = $("#" + key)
    if (input) {
      if (input.hasClass("freq-pst")) {
        if (value) { input.val(value.value) }
      } else {
        input.val(value)
      }
    }
  }
  callback();
}


// ------------------------------------------------------------
// REMOVE the old browser-locale add_minutes()
// ------------------------------------------------------------
// (intentionally deleted)


// ------------------------------------------------------------
// Mission Timing Logic (24-hour system)
// ------------------------------------------------------------
$(document).ready(function () {

  // Format user text input into 24H time
  function normalize_time(str) {
    str = str.replace(/[^0-9]/g, "");
    if (str.length === 3) return "0" + str[0] + ":" + str.slice(1);
    if (str.length === 4) return str.slice(0, 2) + ":" + str.slice(2);
    if (str.length === 5 && str.includes(":")) return str;
    return "";
  }

  function is_valid_24h(t) {
    if (!/^\d{2}:\d{2}$/.test(t)) return false;
    let [h, m] = t.split(":").map(Number);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }

  // Proper 24H add_minutes()
  function add_minutes(time, mins) {
    let [h, m] = time.split(":").map(Number);
    let total = h * 60 + m + mins;
    total = (total + 1440) % 1440;
    let hh = String(Math.floor(total / 60)).padStart(2, "0");
    let mm = String(total % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // Auto format input after typing
  $(document).on("blur", ".time-24", function () {
    let t = normalize_time($(this).val());
    if (is_valid_24h(t)) $(this).val(t);
    else $(this).val("");
  });

  // Auto-calc dependent times
  $("#step-time").on("blur", function () {
    let step = $(this).val();
    if (!is_valid_24h(step)) return;

    $("#checkin-time").val(add_minutes(step, 10));
    $("#taxi-time").val(add_minutes(step, 15));
    $("#takeoff-time").val(add_minutes(step, 20));

    // Push to Waypoints tab
    $("#to-time").val(add_minutes(step, 20)).change();
  });

});
