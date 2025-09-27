// --------- mouse hide functions ----------//
var idleMouseTimer;
var yt_id_cued = "";
var show_toast_global, video_selected_global, add_video_global, set_pl_columns_global, clear_playlist_global;
var add_random_videos_to_pl_global, remove_video_from_playlist_by_id_global;
var player;
const hideCursorDelay = 5000; // 3 seconds
const MIN_ELEMENTS_FOR_SHUFFLE_IN_PL = 10;
function hideCursor() {
  document.body.style.cursor = "none";
  if (YT.PlayerState.PLAYING == player.getPlayerState()) {
    window.chrome.webview.postMessage("form_border_hide");
  }
}
function showCursor() {
  document.body.style.cursor = "default";
}
function resetIdleTimer() {
  clearTimeout(idleMouseTimer);
  showCursor();
  idleMouseTimer = setTimeout(hideCursor, hideCursorDelay);
}

// --------- show hide player -------- //
function show_player(show) {
  document.getElementById("player_box").hidden = !show;
  document.getElementById("help_box").hidden = show;
  if (!show) yt_id_cued = "";
}
function onYouTubeIframeAPIReady() {
  player = new YT.Player('_player', {
    playerVars: {
      'playsinline': 1
    },
    events: {
      'onStateChange': onPlayerStateChange,
      'onError': onErrorOrEnd
    }
  });
}
function load_playlist_item(item, check_player_state) {
  const yt_id = item.id.slice(3);
  if (check_player_state && (YT.PlayerState.PLAYING != player.getPlayerState())) {
    player.cueVideoById(yt_id)
  } else player.loadVideoById(yt_id);
  item.remove();
  mark_video_card_selected(document.getElementById(`vc_${yt_id_cued}`), false);
  yt_id_cued = yt_id;
  btn_skip_next.hidden = (0 == play_list.childElementCount);
}
function onErrorOrEnd(event) {
  const first_queued = play_list.firstElementChild;
  if (first_queued) {
    load_playlist_item(first_queued);
  } else {
    setTimeout(() => {
      mark_video_card_selected(document.getElementById(`vc_${yt_id_cued}`), false);
      // cue back for consistency
      player.cueVideoById(yt_id_cued);
      yt_id_cued = "";
      if (document.getElementById("chk_close_on_play_stop").checked || document.getElementById("chk_shut_on_exit").checked) {
        window.chrome.webview.postMessage("close");
      }
    }, 10);
    btn_skip_next.hidden = true;
  }
}
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.ENDED) {
    onErrorOrEnd(event);
  }
}

// ------------- misc functions --------------- //
function mark_video_card_selected(card, selected) {
  card.dataset.selected = selected ? "1" : "0";
  card.querySelector("span.badge").hidden = !selected;
  show_hide_add_random_videos_to_playlist();
}
function show_hide_add_random_videos_to_playlist() {
  if (vid_list.childElementCount > MIN_ELEMENTS_FOR_SHUFFLE_IN_PL) {
    btn_add_random_videos.hidden = (document.querySelectorAll('.videoCard[data-selected="1"]').length > (MIN_ELEMENTS_FOR_SHUFFLE_IN_PL/2));
  }
  btn_clear_playlist.hidden = 0 == play_list.childElementCount;
}
function slide_push_playlist_item_down(idToMove) {
  const childToMove = document.getElementById(idToMove);
  const parentElement = childToMove.parentNode;
  const nextSibling = childToMove.nextElementSibling;
  if (nextSibling) {
    parentElement.insertBefore(childToMove, nextSibling.nextElementSibling);
  } else {
    parentElement.insertBefore(childToMove, parentElement.firstElementChild);
  }
}
function video_selected_global_by_Id(yt_id) {
  video_selected_global(document.getElementById(`vc_${yt_id}`));
}

function set_theme(theme) {
  document.getElementById("chk_change_theme").checked = theme === "dark";
  document.documentElement.dataset.bsTheme = theme;
}
function set_play_starts_on_selection(start) {
  document.getElementById("chk_play_on_selection").checked = start;
}

// -------- helpers ----------- //
function total_seconds_to_hhmmss(duration) {
  if (isNaN(duration)) return "";
  const HH = `${Math.floor(duration / 3600)}`.padStart(2, '0');
  const MM = `${Math.floor(duration / 60) % 60}`.padStart(2, '0');
  const SS = `${Math.floor(duration % 60)}`.padStart(2, '0');
  return duration > 3600 ? [HH, MM, SS].join(':') : [MM, SS].join(':');
}
function durationToSeconds(durationString) {
  if (!durationString) {
    return null;
  }
  const parts = durationString.split(':');
  if ((parts.length != 3) && (parts.length != 2)) {
    console.warn("Invalid duration string format. Expected HH:MM:SS.");
    return null;
  }
  const hours = parts.length == 3 ? parseInt(parts[0], 10) : 0;
  const minutes = parts.length == 3 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
  const seconds = parts.length == 3 ? parseInt(parts[2], 10) : parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    console.warn("Invalid number in duration string.");
    return null;
  }
  return (hours * 3600) + (minutes * 60) + seconds;
}
function youtube_parser(url) {
  if (url.length < 12) return url;
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  return (match && match[7].length == 11) ? match[7] : "";
}
function populateTimePicker(hoursId, minutesId, secondsId) {
  const hoursSelect = document.getElementById(hoursId);
  const minutesSelect = document.getElementById(minutesId);
  const secondsSelect = document.getElementById(secondsId);

  for (let i = 0; i < 60; i++) {
    const minuteOption = document.createElement('option');
    minuteOption.value = i;
    minuteOption.textContent = String(i).padStart(2, '0');
    minutesSelect.appendChild(minuteOption);

    const secondOption = document.createElement('option');
    secondOption.value = i;
    secondOption.textContent = String(i).padStart(2, '0');
    secondsSelect.appendChild(secondOption);
  }
  for (let i = 0; i < 3; i++) {
    const hourOption = document.createElement('option');
    hourOption.value = i;
    hourOption.textContent = String(i).padStart(2, '0');
    hoursSelect.appendChild(hourOption);
  }
}

// --- document loaded 
function documentLoaded() {
  const vid_list = document.getElementById("vid_list");
  const play_list = document.getElementById("play_list");
  const toast = document.getElementById("toast");
  const play_time = document.getElementById("play_time");
  const pending_duration = document.getElementById("pending_duration");
  const sp_current_time = document.getElementById("sp_current_time");
  const btn_skip_next = document.getElementById("btn_skip_next");
  const btn_add_random_videos = document.getElementById("btn_add_random_videos");
  const btn_clear_playlist = document.getElementById("btn_clear_playlist");
  let exit_date = new Date(8.64e14);

  // player install
  let tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  //------ playlist file loaded -----------//
  document.getElementById('excelFileInput').addEventListener('change', handleFileSelect, false);
  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    //play_list.innerHTML = "";
    //show_player(false);
    const reader = new FileReader();
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      jsonData.forEach(video => {
        if (!video.yt_id) return;
        const duration_secs = Math.max(1, (isNaN(video.duration_sec) ? 0 : video.duration_sec) + 60 * (isNaN(video.duration_min) ? 0 : video.duration_min) + 3600 * (isNaN(video.duration_hours) ? 0 : video.duration_hours));
        const yt_id = youtube_parser(video.yt_id);
        if (yt_id) add_video(yt_id, duration_secs, video.title, false);
      });

      if (!vid_list.innerHTML) {
        show_player(false);
        alert("There was an error reading the excel file. Get the sample, and retry.");
      }
      show_hide_add_random_videos_to_playlist();
    };
    reader.readAsArrayBuffer(file);
  }
  //------ quick link added button -----------//
  document.getElementById("frm_add_quick_link").addEventListener('submit', function (event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const url = formData.get('url');
    const title = formData.get('title');
    const hours = parseInt(formData.get('hours'));
    const mins = parseInt(formData.get('minutes'));
    const secs = parseInt(formData.get('seconds'));
    const yt_id = youtube_parser(url);
    if (yt_id) {
      const ts = Math.max(30, (hours * 3600 + mins * 60 + secs));
      add_video(yt_id, ts, title, true);
      if (document.getElementById("saveToFavorites").checked) {
        window.chrome.webview.postMessage(`fav_add_${yt_id}#${ts}`);
      }
      form.reset();
    }
  });
  //------ exit time set -----------//
  document.getElementById("chk_force_exit").addEventListener('change', (event) => {
    if (event.target.checked) {
      const exit_time = document.getElementById("exit_time");
      exit_date = new Date(new Date().getTime() + parseInt(exit_time.value) * 60000);
      document.getElementById("lbl_for_chk_force_exit").innerText = `Exits at ${exit_date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
      exit_time.hidden = true;
    } else {
      exit_date = new Date(8.64e14);
      document.getElementById("lbl_for_chk_force_exit").innerHTML = "Max&nbsp;Play&nbsp;mins&rarr;";
      exit_time.hidden = false;
    }
  });
  populateTimePicker('hours', 'minutes', 'seconds');
  //------- theme
  document.getElementById("chk_change_theme").addEventListener('change', (event) => {
    document.documentElement.dataset.bsTheme = event.target.checked ? "dark" : "light";
    window.chrome.webview.postMessage(event.target.checked ? "themedark" : "themelight");
  });
  //--------- selection behaviour
  document.getElementById("chk_play_on_selection").addEventListener('change', (event) => {
    window.chrome.webview.postMessage(event.target.checked ? "playonselOn" : "playonselOff");
  });

  // ----- checked change of add video toggle switch ---//
  function video_selected(sender) {
    let duration_of_cued = 0;
    const select_now = ("0" == sender.dataset.selected);
    mark_video_card_selected(sender, select_now)
    if (select_now) {
      if ((0 == play_list.childElementCount) && !yt_id_cued) {
        yt_id_cued = sender.dataset.id;
        if (document.getElementById("chk_play_on_selection").checked) {
          player.loadVideoById(yt_id_cued);
        } else {
          player.cueVideoById(yt_id_cued);
        }
        duration_of_cued = parseInt(sender.dataset.duration);
        show_player(true);
      } else {
        play_list.insertAdjacentHTML("beforeend", `
                                        <li class="list-group-item" id="pl_${sender.dataset.id}" data-duration="${sender.dataset.duration}">
                                          <div class="d-flex align-items-start gap-3">
                                           <div><a role="button" class="icon-link" onclick="javascript:slide_push_playlist_item_down('pl_${sender.dataset.id}');"><i class="bi bi-arrow-down"></i></a></div>
                                            <div style="cursor:pointer" onclick="javascript: load_playlist_item(document.getElementById('pl_${sender.dataset.id}'), true);">
                                               <img style="width:96px;" src="https://img.youtube.com/vi/${sender.dataset.id}/default.jpg" class="card-img-top" />
                                            </div>
                                            <div class="small">${sender.dataset.title}</div>
                                            <div class="ms-auto"><a role="button" class="icon-link" onclick="javascript:remove_video_from_playlist_by_id_global('${sender.dataset.id}'); show_toast_global(0);"><i class="bi bi-trash3"></i></a></div>
                                          </div>
                                        </li>`);
      }
    } else {
      const queued_item = document.getElementById(`pl_${sender.dataset.id}`);
      // remove from playlist sidebar, if item exists in playlist
      if (queued_item) {
        queued_item.remove();
      }
      else {
        // pick the first element of playlist and cue it
        const first_queued = play_list.firstElementChild;
        if (first_queued) {
          yt_id_cued = first_queued.id.slice(3);
          // retain playstate, so cue or load
          if (YT.PlayerState.CUED == player.getPlayerState()) {
            player.cueVideoById(yt_id_cued);
            duration_of_cued = parseInt(first_queued.dataset.duration);
          } else player.loadVideoById(yt_id_cued);
          first_queued.remove();
        }
        else {
          setTimeout(() => {
            // re-cue the video so that player remains consistent
            player.cueVideoById(yt_id_cued);
            // hide the player because there is no selection
            show_player(false);
          }, 10);
        }
      }
    }
    btn_skip_next.hidden = (0 == play_list.childElementCount);
    show_toast(duration_of_cued);
  }

  // ----- add a video to the play queue ---//
  function add_video(yt_id, duration_secs, vid_title, is_quick, insert_top) {
    if (document.getElementById(`col_${yt_id}`) || (yt_id_cued == yt_id)) return false;
    const title = !vid_title ? "(see thumbnail)" : vid_title
    vid_list.insertAdjacentHTML(insert_top ? "afterbegin" : "beforeend",
      `
                                            <div id="col_${yt_id}" class="col">
                                              <div id="vc_${yt_id}" class="card h-100 videoCard" data-selected="0" data-id="${yt_id}" data-title="${title}" data-duration="${duration_secs}" onclick="javascript:return video_selected_global(this);">
                                               <span hidden class="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-danger">selected</span>
                                                <img src="https://img.youtube.com/vi/${yt_id}/hqdefault.jpg" class="card-img-top" />
                                                <div class="card-body">
                                                  <h5  class="card-title">Duration <span class="lxgw">${total_seconds_to_hhmmss(duration_secs)}</span></h5>
                                                  <p class="roboto lead">${title}</p>
                                                </div>
                                                <div class="card-footer">
                                                  <div class="text-center is_quick" ${!is_quick ? "" : "hidden"} ><small class="text-body-secondary font-monospace">${yt_id}</small></div>
                                                  <div id="is_quick${yt_id}" ${is_quick ? "" : "hidden"} class="hstack gap-3 border-0">
                                                      <div><small class="text-body-secondary font-monospace">${yt_id}</small></div>
                                                      <div class="ms-auto"><a role="button" class="icon-link" onclick="(function (e) {e.stopPropagation();setTimeout(() => {document.getElementById('col_${yt_id}').remove(); window.chrome.webview.postMessage('fav_remove_${yt_id}'); const y = document.getElementById('pl_${yt_id}'); if(y) {y.remove();} show_toast_global(0);}, 10)})(event);"><i class="bi bi-trash3"></i></a></div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                        `
    )
    return true;
  }
  // ----- calculates the total duration of queued videos ---//
  function get_queued_duration(duration) {
    if (0 == duration) duration = player.getDuration() - player.getCurrentTime();
    if (!isNaN(duration)) {
      play_list.querySelectorAll('li').forEach(listItem => {
        duration += parseInt(listItem.dataset.duration);
      });
    }
    pending_duration.innerText = total_seconds_to_hhmmss(duration);
    return pending_duration.innerText;
  }
  // ----- clock pulse -------- //
  let intervalId = setInterval(() => {
    const now = new Date();
    sp_current_time.innerText = now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    if (exit_date <= now) {
      clearInterval(intervalId);
      window.chrome.webview.postMessage("close");
    }
    if (YT.PlayerState.PLAYING == player.getPlayerState()) {
      pending_duration.innerText = get_queued_duration(0);
    }
  }, 1000);
  // -------- toast popup on video addition deletion ----------- //
  function show_toast(duration, overriding_msg) {
    setTimeout(() => {
      const text = overriding_msg ? overriding_msg : get_queued_duration(duration);
      if (text) { play_time.innerText = text; bootstrap.Toast.getOrCreateInstance(toast).show(); }
    }, 10);
  }
  //-------- set card size range --- functions
  const range_pl_columns = document.getElementById('range_pl_columns');
  const rangeOutput = document.getElementById('pl_columns');
  let last_class = "row-cols-md-4";
  range_pl_columns.addEventListener('input', function () {
    window.chrome.webview.postMessage(`pl_cols_${this.value}`);
    rangeOutput.textContent = this.value;
    set_pl_columns(this.value);
  });
  function set_pl_columns(value) {
    range_pl_columns.value = value;
    rangeOutput.textContent = range_pl_columns.value;
    vid_list.classList.remove(last_class);
    last_class = `row-cols-md-${value}`;
    vid_list.classList.add(last_class);
  }
  // ------ select videos randomly --------- //
  function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
  }
  function remove_video_from_playlist_by_id(id) {
    setTimeout(() => {
      document.getElementById(`pl_${id}`).remove();
      mark_video_card_selected(document.getElementById(`vc_${id}`), false);
    }, 10);
  }
  function clear_playlist() {
    let arr = new Array();
    for (const child of play_list.children) {
      const id = child.id.substring(3);
      arr.push(id);
    }
    for (let i = 0; i < arr.length; i++) {
      remove_video_from_playlist_by_id(arr[i]);
    }
  }
  function add_random_videos_to_pl(sender) {
    let arr = new Array();
    for (const child of vid_list.children) {
      const id = child.id.substring(4);
      if (document.getElementById(`is_quick${id}`).hidden) arr.push(id);
    }
    shuffle(arr);
    for (let i = 0; i < Math.min(arr.length, MIN_ELEMENTS_FOR_SHUFFLE_IN_PL); i++) {
      video_selected_global_by_Id(arr[i]);
    }
    sender.hidden = true;
  }
  // --------- mouse hide 
  document.body.addEventListener("mousemove", resetIdleTimer);
  resetIdleTimer();
  show_toast_global = show_toast;
  video_selected_global = video_selected;
  add_video_global = add_video;
  set_pl_columns_global = set_pl_columns;
  add_random_videos_to_pl_global = add_random_videos_to_pl;
  remove_video_from_playlist_by_id_global = remove_video_from_playlist_by_id;
  clear_playlist_global = clear_playlist;
}
