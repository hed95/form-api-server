const template = `<html>
<head>
    <link rel='stylesheet' href='https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css'>
    <link rel='stylesheet' href='https://unpkg.com/formiojs@4.0.0-rc.25/dist/formio.full.min.css'>
    <script src='https://unpkg.com/formiojs@4.0.0-rc.25/dist/formio.full.js'></script>
    <script type='text/javascript'>
      window.onload = function() {
       Formio.createForm(document.getElementById('formio'), {{{json formSchema}}}).then(function(form) {
           form.submission = {{{json submission}}}
        });
      };
    </script>
  </head>
  <body>
    <div id='formio'></div>
  </body>
</html>`;

export default template;
