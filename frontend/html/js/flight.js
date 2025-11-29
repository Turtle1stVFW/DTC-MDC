/*
 * Flight.js: Javascript related to the flight page
 */

// Squadron → Callsign / L16 / STN mapping
const SQUADRON_CALLSIGNS = {
  "8th vFS": [
    { voice: "RAM",    l16: "RM", stn: "04551-4" },
    { voice: "FLEECE", l16: "FE", stn: "04561-4" },
    { voice: "HOOF",   l16: "HF", stn: "04571-4" },
    { voice: "SHAUN",  l16: "SN", stn: "04601-4" },
    { voice: "ROMNEY", l16: "RY", stn: "04611-4" },
    { voice: "BOLT",   l16: "BT", stn: "04621-4" },
    { voice: "BURNER", l16: "BR", stn: "04631-4" },
    { voice: "MUSKET", l16: "MT", stn: "04641-4" },
    { voice: "RAZOR",  l16: "RR", stn: "04651-4" },
  ],
  "561st vFS": [
    { voice: "THUD",    l16: "TD", stn: "56111-4" },
    { voice: "PHANTOM", l16: "PM", stn: "56121-4" },
    { voice: "WILD",    l16: "WD", stn: "56131-4" },
    { voice: "WEASEL",  l16: "WL", stn: "56141-4" },
    { voice: "KNIGHT",  l16: "KT", stn: "56151-4" },
    { voice: "BLACK",   l16: "BK", stn: "56161-4" },
    { voice: "DAGGER",  l16: "DR", stn: "56211-4" },
    { voice: "SWORD",   l16: "SD", stn: "56221-4" },
    { voice: "RAMBO",   l16: "RO", stn: "56231-4" },
  ],
  "18th vAGRS": [
    { voice: "BISON",  l16: "BN", stn: "01611-4" },
    { voice: "MOOSE",  l16: "ME", stn: "01621-4" },
    { voice: "YUKON",  l16: "YN", stn: "01631-4" },
    { voice: "MIG",    l16: "MG", stn: "01641-4" },
    { voice: "IVAN",   l16: "IN", stn: "01651-4" },
    { voice: "SLAM",   l16: "SM", stn: "01661-4" },
    { voice: "SNAKE",  l16: "SE", stn: "02011-4" },
    { voice: "VADER",  l16: "VR", stn: "02021-4" },
    { voice: "RAVEN",  l16: "RN", stn: "02031-4" },
  ],
};

// Auto-generate Mission Number as YYMMDD-XX
$('#mission-number-generate').click(function(e) {
  e.preventDefault();

  const input = $('#mission-id');
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const base = yy + mm + dd;

  const current = input.val().trim();
  let seq = 1;

  const re = new RegExp('^' + base + '-(\\d{2})$');
  const match = current.match(re);
  if (match) {
    seq = parseInt(match[1], 10) + 1;
  }

  const nextId = base + '-' + String(seq).padStart(2, '0');
  input.val(nextId);
});

// Auto-generate Callsign + seed F-16C member IDs/TNs
$('#mission-callsign-generate').click(function(e) {
  e.preventDefault();

  const sq = $('#mission-squadron').val();
  if (!sq) {
    alert('Select a Squadron first.');
    return;
  }

  const list = SQUADRON_CALLSIGNS[sq] || [];
  if (!list.length) {
    alert('No callsigns defined for this squadron.');
    return;
  }

  // 1) Pick a random callsign from that squadron
  const choice = list[Math.floor(Math.random() * list.length)];

  // 2) Pick a random flight number 1–9
  const flightNum = Math.floor(Math.random() * 9) + 1;

  // 3) Store mission-level fields
  $('#mission-callsign').val(choice.voice);              // e.g. FLEECE
  $('#mission-flight-number').val(flightNum);            // e.g. 7
  $('#mission-l16-callsign').val(choice.l16);            // e.g. FE
  $('#mission-stn').val(choice.stn);                     // e.g. 04561-4

  // 4) If we're not in an F-16C, don't touch the members table
  const ac = $('#flight-airframe').val();
  if (ac !== 'F-16C') {
    return;
  }

  // 5) Build a header map for the members table
  const headerMap = {};
  $('#flight-members-table > thead > tr > th').each(function(idx, th) {
    const key = th.innerText.trim().toUpperCase();
    if (key) headerMap[key] = idx;
  });

  const csIdx  = headerMap['CS'];
  const idIdx  = headerMap['ID'];
  const tnIdx  = headerMap['TN'];

  if (csIdx == null || idIdx == null || tnIdx == null) {
    // Headers not as expected; don't crash
    return;
  }

  // 6) Parse STN base from "04561-4" => "04561"
  let stnBase = '';
  if (choice.stn) {
    const m = String(choice.stn).match(/^(\d{5})/);
    if (m) stnBase = m[1];  // "04561"
  }

  const rows = $('#flight-members-table > tbody > tr');
  if (!rows.length) {
    // No rows to populate; user can add members first, then press Auto again
    return;
  }

  // 7) One-time autofill for each existing member row
  rows.each(function(rowIdx, row) {

    const pos = rowIdx + 1; // 1-based position in flight

    // Voice callsign: FLEECE 71, FLEECE 72, etc.
    const csVal = `${choice.voice} ${flightNum}${pos}`;
    row.cells[csIdx].firstChild.value = csVal;

    // ID: FE71, FE72, etc. (L16 + flight + pos)
    const idPrefix = choice.l16 + String(flightNum);
    row.cells[idIdx].firstChild.value = idPrefix + String(pos);

    // TN: STN base + index: 04561, 04562, etc.
    if (stnBase) {
      const tnVal = String(parseInt(stnBase, 10) + (pos - 1)).padStart(stnBase.length, '0');
      row.cells[tnIdx].firstChild.value = tnVal;
    }

  });

  // All of these values remain fully editable after this point.
});

$('#flight-add-member').click(function() {
  flightmembers_add();
});

$("#flight-airframe").on('change', function(e) {

  var target = $(e.target);

  // See if we're updating or staying the same
  var old_type = $(e.target).data('previous');
  var new_type = target.val();
  $(e.target).data('previous', new_type);

  if (new_type == old_type) {
    return;
  }

  // Only update the table if we have a type etc.
  if (new_type) {

    // Update table format
    flightmembers_format();

    // Add one for convienience
    flightmembers_add();

    // If we're moving to a different airframe and the route doesn't match,
    // then clear the route data
    var route = target.data('route');
    if (route && route.xml_format == "cf" && route.aircraft != new_type) {
      target.data('route', null);
    }

    // Update default coordinate format
    flight_update_default_coord_format()

    // Update all preset-freqs
    update_presets()
  }

  // Show options
  $('#flight-members-container').toggle(new_type !== null);

  // Hide anything rotary only
  let rotary = airframes?.[new_type]?.rotary === true;
  $('.fixed-wing-only').toggle(!rotary);
  $('.rotary-only').toggle(rotary);

  // If we're apache, set the DL to apache for now, also disable the presets
  // page as it's not supported in game
  if (new_type == 'AH-64D') {
    $("#download-template").val("Apache");
    $("#download-template").prop("disabled", true);
    $("#nav-item-presets").hide();
  } else {
    $("#download-template").val("2022-05");
    $("#download-template").prop("disabled", false);
    $("#nav-item-presets").toggle(new_type !== 'Ka-50');
  }

  // Show tertiary for AH64
  $('#mission-ter-frequency').toggle(new_type === "AH-64D");

  // Trigger event for other pages
  $('#flight-airframe').trigger('flight-airframe-changed');

  // Save and unlock all components if successful
  save({'callback': function() { $("a.nav-link.disabled").removeClass('disabled'); }})

});

$("input[name=flight-coord]").change(function() {
  let val = $(this).val();

  // When we change to MGRS, default decimals to 5 (1m) resolution
  if (val === "mgrs") {
    $("#flight-coord-decimals").val(5);
    coords.set_display_decimals(5);
  }
  coords.set_display_format(val);
});

$("#flight-coord-decimals").change(function() {
  coords.set_display_decimals($(this).val());
});

function flight_update_default_coord_format() {

  var ac = $("#flight-airframe").val()

  var fmt = "ddm"
  var dp = 3

  if (ac == "F-14B") {
    dp = 1
  } else if (ac == 'AV8BNA') {
    fmt = "dms";
    dp = 0;
  } else if (ac == 'AH-64D') {
    fmt = "mgrs";
    dp = 4;
  }

  // Update Radio / DP
  $('#flight-coord-'+fmt).click();
  $('#flight-coord-decimals').val(dp).change();

  // Set them in case the click/change doesn't trigger nicely
  coords.set_display_format(fmt);
  coords.set_display_decimals(dp);
}

function pilot_autocomplete(input, fields=null, rio=false) {
  $(input).autocomplete({
    source: function(request, response) {
      response(match_key_in_arr(squadron_data.members, "name", request.term, function(x) { x.value = x.name; return x; }))
    },
    minLength: 1,
    select: function( event, ui) {
      var ac = $("#flight-airframe").val();
      if (!rio && fields) {
        event.target.parentElement.parentElement.cells[fields[0]].children[0].value = ui.item.borts && ui.item.borts[ac] ? ui.item.borts[ac] : "";
      }
    }
  });
}

function flightmembers_items(ac) {

  // Returns a list of column headers, widths, and classes

  var cols = [
    ["CS", 100, "text-center", "text", ""],
    ["CREW", 0, "", "text", "^.+$"],
  ];

  if (ac == "F-14B") {
    cols.push(['RIO', 0, "", "text"]);
  }

  if (ac == "F-15ESE") {
    cols.push(['WSO', 0, "", "text"]);
  }

  if (["AH-64D", "OH58D"].includes(ac)) {
    cols.push(['CPG', 0, "", "text"]);
  }

  // ----------------------------------------------------
  // CUSTOM F-16C FORMAT
  // CS | CREW | TCN | ID | TN | IDM | M1/2/3/4 | LSR | LSS | RDR | SRCH
  // ----------------------------------------------------
  if (ac == "F-16C") {

    // TCN with existing formatter callback
    cols.push(
      ['TCN', 60, "text-center", "text",
        '^([0-9]+\\s*(X|Y))?$',
        function(field) { tcn_formatter(field); }
      ]
    );

    cols.push(['ID',   60, "text-center", "text"]);
    cols.push(['TN',   70, "text-center", "text"]);
    cols.push(['IDM',  50, "text-center", "number"]);

    // Combined M1/2/3/4 as one free text field
    cols.push(['M1/2/3/4', 100, "text-center", "text"]);

    // LSR + LSS once each
    cols.push(['LSR', 50, "text-center", "number"]);
    cols.push(['LSS', 50, "text-center", "number"]);

    // Radar / Search
    cols.push(['RDR', 50, "text-center", "text"]);
    cols.push(['SRCH', 50, "text-center", "text"]);

    // IMPORTANT: no generic TCN/LSR/LSS/HM DEVICE/SQUAWK for F-16C
    return cols;
  }

  // F/A-18C additional flight / element comms 
  if (ac == "FA-18C") {
    cols.push(
      ['MIDS A', 60, "text-center", "number"],
      ['MIDS B', 60, "text-center", "number"]
    );
  }

  // The following airframes have a choice between NVGs and HMD
  if (['FA-18C'].includes(ac)) {
    cols.push(
      ['HM DEVICE', 100, "text-center", "select", ["JHMCS", "NVGs"]]
    );
  } else if (ac == 'Ka-50') {
    cols.push(
      ['HM DEVICE', 100, "text-center", "select", ["HMS", "NVGs"]]
    );
  } else if (ac == 'AV8BNA') {
    cols.push(
      ['HM DEVICE', 100, "text-center", "select", ["NVGs", "Visor"]]
    );
  }

  if (["F-14B", "FA-18C"].includes(ac)) {
    cols.push(
      ['BORT', 50, "text-center", "number"]
    );
  }

  if (ac == "A-10C") {
    cols.push(
      ['GID', 50, "text-center", "number"],
      ['OID', 50, "text-center", "number"]
    );
  }

  // Generic TCN for other fixed-wing
  if (!["UH-1H", "Ka-50", "Mi-8MT", "AH-64D", "UH-60L"].includes(ac)) {
    cols.push(
      ['TCN', 50, "text-center", "text",
        '^([0-9]+\\s*(X|Y))?$',
        function(field) { tcn_formatter(field); }
      ]
    );
  }

  // Generic LSR / LSS for others
  if (!["UH-1H", "Mi-8MT", "UH-60L"].includes(ac)) {

    // Whilst the M2k doesn't have a pod, we still include LSR as it can carry
    // GBU-12s and as such it is still required for reference to set the code
    // from the kneeboard
    
    cols.push(
      ['LSR', 50, "text-center", "number"]
    );

    if (!["AH-64D", "Ka-50", "F-14B", "M-2000C"].includes(ac)) {
      cols.push(
        ['LSS', 50, "text-center", "number"]
      );
    }
  }

  // SQUAWK intentionally removed globally

  return cols;

}


function flightmembers_format() {

  var ac = $("#flight-airframe").val();
  var cols = flightmembers_items(ac);

  var header = "<tr>";
  var colgroup = "";

  for (col in cols) {
    var [title, width, cls, typ, pattern, setup_fnc] = cols[col];

    if (width) {
      colgroup += `<col style="width: ${width}px" />`;
    } else {
      colgroup += `<col />`;
    }

    if (cls != "") {
      header += `<th scope="col" class="${cls}">${title}</th>`;
    } else {
      header += `<th scope="col">${title}</th>`;
    }
  }
  header += "</tr>";

  // Add colgroup for delete
  colgroup += `<col style="width: 22px" />`;

  $("#flight-members-table > colgroup").empty().append(colgroup);
  $("#flight-members-table > thead").empty().append(header);
  $("#flight-members-table > tbody").empty();

  // Set last head item colspan to 2 to cater for delete
  $("#flight-members-table > thead > tr > th:last").attr('colspan', 2);

}

function flightmembers_del(tr) {

  // Get the column identifiers
  var elems = {};

  var cols = flightmembers_items($("#flight-airframe").val());
  for (col in cols) {
    var [title, width, cls, typ, pattern, setup_fnc] = cols[col];
    elems[title] = col;
  }

  // When we delete a flight member, if it's the last row then we update the
  // LSS - if we delete a mid row flight member, do we renumber the IDs /
  // re-create all the LSS / LSR ?
  
  var rows = $("#flight-members-table > tbody > tr");
  var row_id = rows.length - 1;

  // We only care if more than 2 ship
  if (rows.length > 2 && rows.length % 2 == 0) {
    if (elems['LSS']) {
      rows[row_id - 1].cells[elems['LSS']].firstChild.value = rows[row_id - 3].cells[elems['LSR']].firstChild.value;
    }
  }

  // Allow the previous row to be deleted
  if (row_id > 0) {
    var cells = rows[row_id - 1].cells;
    $(cells[cells.length-1]).html($(`
      <button type="button" class="btn btn-link btn-sm p-0 pt-0.5" onclick='flightmembers_del($(this).closest("tr"));'>
        <i data-feather="delete"></i>
      </button>`));

    feather.replace();
  }

  tr.remove();
}


function flightmembers_add(values) {

  values = values || {};

  // Adds a row to flight-members-table
  var ac = $("#flight-airframe").val();
  var cols = flightmembers_items(ac);
  var html = "<tr>";

  var first_row = $("#flight-members-table > tbody > tr:first");
  var last_row = $("#flight-members-table > tbody > tr:last");
  var elems = {};

  var last_col_id = cols.length - 1;

  for (col in cols) {
    var [title, width, cls, typ, pattern, setup_fnc] = cols[col];
    var value_id = title.toLowerCase();

    elems[title] = col;

    var value = "";
    if (title == "#") {
      value_id = "id";
      value = 1;
    }

    value = values[value_id] || value;

    // Remove right hand border for delete icon to be pretty
    var cls_append = col == last_col_id ? " border-right-0" : "";

    if (typ == "select") {
    
      html += `<td class="input-container${cls_append}">
                <select class="input-full ${cls}">`;

      for (var itm of pattern) {
        html += `<option${itm == value ? ' selected' : ''}>${itm}</option>`;
      }
      html += `</select></td>`;

    } else {

      // Hide spinner as it takes up valuable space
      if (typ == "number") {
        cls += " nospin";
      }

      html += `<td class="input-container${cls_append}"><input type="${typ}" class="input-full ${cls}" value="${value}" `;

      if (pattern) {
        html += `pattern="${pattern}" `;
      }

      html += `></td>`;
    }

  }

  html += `
      <td class="input-container text-center border-left-0">
        <button type="button" class="btn btn-link btn-sm p-0 pt-0.5" onclick='flightmembers_del($(this).closest("tr"));'>
          <i data-feather="delete"></i>
        </button>
      </td>`;

  html += "</tr>";

  $("#flight-members-table > tbody").append(html);

  var rows = $("#flight-members-table > tbody > tr");
  var row_id = rows.length - 1;
  var new_last_row = $(rows[row_id]);

// =====================================================
// DEFAULT M1/M2/M3/M4 FOR F-16C
// =====================================================
if (ac === "F-16C") {
    let lastRow = new_last_row;

    try {
        // Locate the combined M1/2/3/4 column by title
        let cols = flightmembers_items(ac);
        let mIdx = cols.findIndex(c => c[0] === "M1/2/3/4");

        if (mIdx !== -1) {
            // Set default
            lastRow[0].cells[mIdx].firstChild.value = "OFF/OFF/AS/ON";
        }
    } catch (e) {
        console.error("Error setting Mode defaults:", e);
    }
}

// =====================================================
// DEFAULT SRCH PATTERN FOR F-16C
// =====================================================
if (ac === "F-16C") {
    try {
        let lastRow = new_last_row;

        // Figure out which row number this is (1-based)
        let pos = $("#flight-members-table > tbody > tr").length;

        // SRCH pattern (repeats every 4)
        const pattern = ["LO", "HI", "HI", "LO"];

        // Find SRCH column index
        let cols = flightmembers_items(ac);
        let srchIdx = cols.findIndex(c => c[0] === "SRCH");

        if (srchIdx !== -1) {
            lastRow[0].cells[srchIdx].firstChild.value =
                pattern[(pos - 1) % pattern.length];
        }
    } catch (e) {
        console.error("Error setting SRCH pattern:", e);
    }
}
// =====================================================
// DEFAULT RDR SEQUENCE FOR F-16C (1,2,3,4...)
// =====================================================
if (ac === "F-16C") {
    try {
        let lastRow = new_last_row;

        // Determine this member's position in the flight (1-based)
        let pos = $("#flight-members-table > tbody > tr").length;

        // Locate RDR column index
        let cols = flightmembers_items(ac);
        let rdrIdx = cols.findIndex(c => c[0] === "RDR");

        if (rdrIdx !== -1) {
            lastRow[0].cells[rdrIdx].firstChild.value = pos.toString();
        }
    } catch (e) {
        console.error("Error setting RDR sequence:", e);
    }
}


  // Remove last rows delete
  if (last_row[0]) {
    var cells = last_row[0].cells;
    $(cells[cells.length-1]).empty();
  }

  // Handle Setup Functions
  for (col in cols) {
    var [title, width, cls, typ, pattern, setup_fnc] = cols[col];
    if (setup_fnc) {
      setup_fnc(new_last_row[0].cells[col].firstChild);
    }
  }

  // Manage TCN
  if (first_row[0] != undefined && elems['TCN']) {
    if (!values['tcn']) {
      var first_tcn = first_row[0].cells[elems['TCN']].firstChild.value.match(/^([0-9]+)(.*)/);
      if (first_tcn) {
        new_last_row[0].cells[elems['TCN']].firstChild.value = String(parseInt(first_tcn[1]) + 63) + first_tcn[2];
      }
    }
  }

  // Handle incrementing values
  var incrs = ['#', 'SQUAWK', 'LSR', 'OID'];
  for (var incr of incrs) {
    if (values[incr.toLowerCase()]) {
      continue;
    }
    try {
      var last_val = last_row[0].cells[elems[incr]].firstChild.value;
      if (last_val) {
        new_last_row[0].cells[elems[incr]].firstChild.value = parseInt(last_val)+1 || "";
      }
    } catch(e) {}
  }

  // Persistent values
  var persists = ['GID', 'MIDS A', 'MIDS B'];
  for (var persist of persists) {
    if (values[persist.toLowerCase()]) {
      continue;
    }
    try {
      var last_val = last_row[0].cells[elems[persist]].firstChild.value;
      if (last_val) {
        new_last_row[0].cells[elems[persist]].firstChild.value = last_val;
      }
    } catch(e) {}
  }

  if (!values['squawk']) {
    try {
      var lsr = last_row[0].cells[elems['SQUAWK']].firstChild.value;
      if (lsr) {
        new_last_row[0].cells[elems['SQUAWK']].firstChild.value = parseInt(lsr)+1 || "";
      }
    } catch(e) {}
  }

  // LSS fun:
  //   - On adding 2nd, we set 1 to 2 LSR, 2 to 1 LSR
  //   - On adding 3rd, we set 3 to 1 LSR
  //   - On adding 4th, we set 3 to 4 LSR
  //   - And continue creating 2 ship elements
  //
  // We ONLY do this if LSS is empty on the row we're adding else we might
  // change data on reloading a saved MDC
  //
  if (elems['LSS'] && values['lss'] == undefined) {

    // Ignore Flight lead
    if (row_id > 0) {

      // If were completing a 2 ship (element) then we also set the element
      // lead LSS to LSR of wing, otherwise, we use the last element leads LSR
      //
      // This does lead to a 5 ship being element of 2 and then a 2nd element
      // of 3, but the creator will just have to juggle the codes as they
      // desire in such cases
      
      if (row_id % 2 == 1) {
        rows[row_id].cells[elems['LSS']].firstChild.value = rows[row_id-1].cells[elems['LSR']].firstChild.value;

        // As we're completing an element, we set the element lead to our value
        rows[row_id-1].cells[elems['LSS']].firstChild.value = rows[row_id].cells[elems['LSR']].firstChild.value;
      } else {
        // We're adding an odd number and have to use row_id - 2
        rows[row_id].cells[elems['LSS']].firstChild.value = rows[row_id-2].cells[elems['LSR']].firstChild.value;
      }

    }
  }
  
  // Lastly add autocomplete
  if (elems['BORT']) {
    pilot_autocomplete(new_last_row[0].cells[1].firstChild, [elems['BORT']]);

    if (elems['RIO']) {
      pilot_autocomplete(new_last_row[0].cells[2].firstChild, [elems['BORT']], 1);
    }
  } else {
    pilot_autocomplete(new_last_row[0].cells[1].firstChild);

    if (elems['WSO']) {
      pilot_autocomplete(new_last_row[0].cells[2].firstChild);
    }

    if (elems['CPG']) {
      pilot_autocomplete(new_last_row[0].cells[2].firstChild);
    }
  }

  // Replace feather
  feather.replace();

}



function flight_export() {
  var ret = get_form_data($("#flight-form"));
  ret['members'] = [];
  ret['mission-type'] = $("#mission-type").val();

  var headers = [];
  $("#flight-members-table > thead > tr > th").each(function(idx, row) {
    headers.push(row.innerText.toLowerCase());
  });
  headers[0] = "id";

  $("#flight-members-table > tbody > tr").each(function(idx, row) {
    ret['members'].push(get_row_data(row, headers));
  });

  return ret;
}

function flight_load(data, callback) {

  if (!data) { callback(); return; }

  $("#flight-airframe").val(data['flight-airframe']).change();
  $("#mission-type").val(data['mission-type']);
  $('#flight-coord-' + data['flight-coord']).click();
  $("#flight-coord-decimals").val(data['flight-coord-decimals']).change();

  flightmembers_format();
  data['members'].forEach(function(member) {
    flightmembers_add(member);
  });

  callback();

}
