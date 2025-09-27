namespace YutubeApp
{
    partial class Form1
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

    #region Windows Form Designer generated code

    /// <summary>
    ///  Required method for Designer support - do not modify
    ///  the contents of this method with the code editor.
    /// </summary>
    private void InitializeComponent()
    {
      System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(Form1));
      wvMain = new Microsoft.Web.WebView2.WinForms.WebView2();
      lblLoading = new Label();
      ((System.ComponentModel.ISupportInitialize)wvMain).BeginInit();
      SuspendLayout();
      // 
      // wvMain
      // 
      wvMain.AllowExternalDrop = false;
      wvMain.CreationProperties = null;
      wvMain.DefaultBackgroundColor = Color.Transparent;
      wvMain.Dock = DockStyle.Fill;
      wvMain.Location = new Point(0, 0);
      wvMain.Name = "wvMain";
      wvMain.Size = new Size(800, 450);
      wvMain.TabIndex = 0;
      wvMain.ZoomFactor = 1D;
      wvMain.CoreWebView2InitializationCompleted += WvMain_CoreWebView2InitializationCompleted;
      // 
      // lblLoading
      // 
      lblLoading.Dock = DockStyle.Fill;
      lblLoading.Location = new Point(0, 0);
      lblLoading.Name = "lblLoading";
      lblLoading.Size = new Size(800, 450);
      lblLoading.TabIndex = 1;
      lblLoading.Text = "Loading, please wait... can take longer...";
      lblLoading.TextAlign = ContentAlignment.MiddleCenter;
      // 
      // Form1
      // 
      AutoScaleDimensions = new SizeF(7F, 17F);
      AutoScaleMode = AutoScaleMode.Font;
      ClientSize = new Size(800, 450);
      Controls.Add(wvMain);
      Controls.Add(lblLoading);
      Icon = (Icon)resources.GetObject("$this.Icon");
      Name = "Form1";
      SizeGripStyle = SizeGripStyle.Show;
      Text = "Yutube App";
      FormClosing += Form1_FormClosing;
      SizeChanged += Form1_SizeChanged;
      ((System.ComponentModel.ISupportInitialize)wvMain).EndInit();
      ResumeLayout(false);
    }

    #endregion

    private Microsoft.Web.WebView2.WinForms.WebView2 wvMain;
    private Label lblLoading;
  }
}
