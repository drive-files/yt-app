using Microsoft.Web.WebView2.Core;
using System.Diagnostics;
using System.Net;
using System.Security.Policy;
namespace YutubeApp;
public partial class Form1 : Form
{
  public Form1()
  {
    InitializeComponent();
    SynchronizationContext.Current?.Send(async _ =>
    {
      await StartServer();
    }, null);
    SetScreenSmall();
    InitializeWebView2();
  }
  void SetScreenSmall()
  {
    var screenSize = Screen.FromControl(this).WorkingArea;
    Height = (9 * screenSize.Height) / 10;
    Width = (9 * screenSize.Width) / 10;
    Top = 20;
    Left = screenSize.Width / 20;
  }
  string? url;
  private async void InitializeWebView2()
  {
    var op = new CoreWebView2EnvironmentOptions("--disable-web-security");
    var env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "YutubeApp"), op);
    await wvMain.EnsureCoreWebView2Async(env);
    wvMain.CoreWebView2.Navigate(url);

  }
  private void WvMain_CoreWebView2InitializationCompleted(object sender, CoreWebView2InitializationCompletedEventArgs e)
  {
    WindowState = FormWindowState.Maximized;
    wvMain.CoreWebView2.ServerCertificateErrorDetected += (s, e) => e.Action = CoreWebView2ServerCertificateErrorAction.AlwaysAllow;
    wvMain.CoreWebView2.ScriptDialogOpening += CoreWebView2_ScriptDialogOpening;
    wvMain.CoreWebView2.WebMessageReceived += CoreWebView2_WebMessageReceived;
    wvMain.NavigationStarting += (e, a) => wvMain.Enabled = false;
    wvMain.NavigationCompleted += async (e, a) =>
    {
      foreach(string? u in Properties.Settings.Default.FavoriteLinks)
      {
        if (!string.IsNullOrEmpty(u))
        {
          string url = u;
          int duration = 30;
          int i;
          if(-1 != (i = (url.IndexOf('#'))))
          {
            try
            {
              duration = Int32.Parse(url.Substring(i + 1));
            }
            catch
            {

            }
            url = url.Remove(i);
          }
          await wvMain.CoreWebView2.ExecuteScriptAsync($"add_video_global('{url}', {duration}, '', true, false)");
        }
      }
      // set theme
      await wvMain.CoreWebView2.ExecuteScriptAsync($"set_theme('{Properties.Settings.Default.Theme}');");
      await wvMain.CoreWebView2.ExecuteScriptAsync($"set_play_starts_on_selection('{(Properties.Settings.Default.PlayOnSel ? "1" : string.Empty)}');");
      wvMain.Enabled = true;
      if (!wvMain.Visible) wvMain.Visible = true;
    };
    wvMain.CoreWebView2.NewWindowRequested += async (s, e) =>
    {
      if (e.Handled = !e.Uri.Contains("amardeep"))
      {
        string url = await wvMain.CoreWebView2.ExecuteScriptAsync($"youtube_parser('{e.Uri}');");
        if (!string.IsNullOrEmpty(url))
        {
          await wvMain.CoreWebView2.ExecuteScriptAsync($"add_video_global({url}, 30, '', true, true)");
          await wvMain.CoreWebView2.ExecuteScriptAsync($"video_selected_global_by_Id({url})");
        }
      }
    };
    wvMain.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
    wvMain.CoreWebView2.Settings.AreBrowserAcceleratorKeysEnabled = false;
    wvMain.CoreWebView2.Settings.IsSwipeNavigationEnabled = false;
    wvMain.CoreWebView2.Settings.AreDevToolsEnabled = false;
    wvMain.CoreWebView2.Settings.AreDefaultScriptDialogsEnabled = false;
    wvMain.CoreWebView2.Settings.IsStatusBarEnabled = false;

  }
  private void CoreWebView2_ScriptDialogOpening(object? sender, Microsoft.Web.WebView2.Core.CoreWebView2ScriptDialogOpeningEventArgs e)
  {
    CoreWebView2Deferral d = e.GetDeferral();
    BeginInvoke(() =>
    {
      if (e.Kind == CoreWebView2ScriptDialogKind.Alert)
      {
        MessageBox.Show(this, e.Message, Text, MessageBoxButtons.OK, MessageBoxIcon.None);
      }
      else if (e.Kind == CoreWebView2ScriptDialogKind.Confirm)
      {
        if (DialogResult.Yes == MessageBox.Show(this, e.Message, Text, MessageBoxButtons.YesNo, MessageBoxIcon.Question))
        {
          e.Accept();
        }
      }
      d.Complete();
      wvMain.Focus();
    });
  }

  bool shutOnExit;
  private void CoreWebView2_WebMessageReceived(object? sender, Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs e)
  {
    string message = e.TryGetWebMessageAsString();
    if (message.StartsWith("shut_")) shutOnExit = message.EndsWith('y');
    else if (message.StartsWith("close")) { Close(); }
    else if (message.StartsWith("excel"))
    {
      string path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), $"Playlist.xlsx");
      for (int i = 0; File.Exists(path) && i < 100; i++)
      {
        path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), $"Playlist_{i + 1}.xlsx");
      }
      File.WriteAllBytes(path, Res.sample);
      MessageBox.Show(this, $"We have saved a file called '{Path.GetFileName(path)}' on the Desktop. Check that out!", Text, MessageBoxButtons.OK, MessageBoxIcon.Information);
    }
    else if (message.StartsWith("theme"))
    {
      Properties.Settings.Default.Theme = message.EndsWith("dark") ? "dark" : "light";
      Properties.Settings.Default.Save();
    }
    else if (message.StartsWith("playonsel"))
    {
      Properties.Settings.Default.PlayOnSel = message.EndsWith("On");
      Properties.Settings.Default.Save();
    }
    else if (message.StartsWith("fav_add_"))
    {
      System.Collections.Specialized.StringCollection col = Properties.Settings.Default.FavoriteLinks ?? new System.Collections.Specialized.StringCollection();
      col.Add(message.Substring(8));
      Properties.Settings.Default.Save();
    }
    else if (message.StartsWith("fav_remove_"))
    {
      string ytId = message.Substring(11);
      var col = Properties.Settings.Default.FavoriteLinks;

      for (int x = 0; x < col.Count; x++)
      {
        if (true == col[x]?.StartsWith(ytId))
        {
          Properties.Settings.Default.FavoriteLinks.Remove(col[x]);
          Properties.Settings.Default.Save();
          break;
        }
      }
    }
    else if (message.StartsWith("win_"))
    {
      if (message.EndsWith("min"))
      {
        WindowState = FormWindowState.Minimized;
      }
      else if (message.EndsWith("restore"))
      {
        if (WindowState == FormWindowState.Maximized)
        {
          WindowState = FormWindowState.Normal;
          FormBorderStyle = FormBorderStyle.Sizable;
        }
        else if (WindowState == FormWindowState.Normal)
        {
          FormBorderStyle = (FormBorderStyle == FormBorderStyle.None) ? FormBorderStyle.Sizable : FormBorderStyle.None;
        }
      }
      // close button clicked
      else if (message.EndsWith("close"))
      {
        shutOnExit = false;
        Close();
      }
    }
    else MessageBox.Show(message);
  }
  async Task StartServer()
  {
    HttpListener listener = new HttpListener();
    listener.Prefixes.Add(url = "http://localhost:8080/");
    int attempt = 0;
    for (; attempt < 5; attempt++)
    {
      try
      {
        listener.Start();
        break;
      }
      catch
      {
        listener = new HttpListener();
        listener.Prefixes.Add(url = $"http://localhost:{49000 + attempt}/");
      }
    }
    if (attempt < 5)
    {
      while (true)
      {
        HttpListenerContext context = await listener.GetContextAsync();
        HttpListenerRequest request = context.Request;
        HttpListenerResponse response = context.Response;
        // Process the request and generate a response
        string responseString = Res._Player;
        byte[] buffer = System.Text.Encoding.UTF8.GetBytes(responseString);
        response.ContentLength64 = buffer.Length;
        response.ContentType = "text/html";
        response.OutputStream.Write(buffer, 0, buffer.Length);
        response.OutputStream.Close();
      }
    }
    listener.Stop();
    listener.Close();
  }

  private void Form1_FormClosing(object sender, FormClosingEventArgs e)
  {
    if (shutOnExit)
    {
      Process.Start("shutdown", "/s /t 0");
    }
  }

  private void Form1_SizeChanged(object sender, EventArgs e)
  {
    if (WindowState == FormWindowState.Maximized)
    {
      FormBorderStyle = FormBorderStyle.None;
    }
  }
}
