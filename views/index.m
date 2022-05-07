<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>Piece of Pixel</title>

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.4.1/dist/css/bootstrap.min.css"
    integrity="sha384-HSMxcRTRxnN+Bdg0JdbxYKrThecOKuH5zCYotlSAcp1+c8xmyTe9GYg1l9a69psu" crossorigin="anonymous">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat&family=Noto+Sans&display=swap" rel="stylesheet">
  <link href="/styles.css" rel="stylesheet">

  <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
  <script src="https://code.jquery.com/jquery-1.12.4.min.js"
    integrity="sha384-nvAa0+6Qg9clwYCGGPpDQLVpLNn0fRaROjHqs13t4Ggj3Ez50XnGQqc/r8MhnRDZ"
    crossorigin="anonymous"></script>
  <!-- Include all compiled plugins (below), or include individual files as needed -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@3.4.1/dist/js/bootstrap.min.js"
    integrity="sha384-aJ21OjlMXNL5UyIl/XNwTMqvzeRMZH2w8c5cRVpzpU8Y5bApTppSuUkhZXN0VxHd"
    crossorigin="anonymous"></script>
  <script src="/script.js"></script>

</head>

<body>
  <section class="hero">

    <div class="container">
      <div class="row justify-content-center">
        <div class="col col-xl-8 justify-content-center">
          <h1 class="col-4">Piece of Pixel <img src="/ukraine.png" height="30" width="30"></h1>
          <p class="lead">
            Buy a bunch of pixels, unlock new art and save Ukrainian lifes.
          </p>
          <hr>
          <p>
          <ul>
            <li>Gorgeous <a href="https://www.instagram.com/duke_mort_pixel">Duke Mort</a> draws a pixelart</li>
            <li>You all buy a piece of it (or several pieces - the more the merrier!)</li>
            <li>After piece is bought, it is unlocked on this page with your name on it</li>
            <li>We transfer all the money to the <a href="https://www.comebackalive.in.ua/">'Come Back Alive'</a>
              charity
              foundation or some other urgent fundraising</a></li>
          </ul>
          </p>
        </div>
      </div>
    </div>
    </div>
  </section>
    <div class="container col align-self-center">
      <div class="matrix">

        {{#rows}}
        <div class="matrix-row">
          {{#cols}}
          <img tabindex="0" data-toggle="popover" class="tile" id="{{image_id}}" title="{{image_id}}"
            data-trigger="focus" data-placement="auto top" data-html="true" src="im-300.png" width=30 height=30>
          {{/cols}}
        </div>
        {{/rows}}
      </div>
    </div>

    <script>
      var image_data = {{{ image_data }}};
    </script>
    <script src="/zoom-by-ironex.min.js"></script>


</body>

</html>