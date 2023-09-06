using Microsoft.Extensions.Options;
using Throneteki.Lobby.Services;
using Microsoft.IdentityModel.Tokens;
using OpenIddict.Validation.AspNetCore;
using Quartz;
using StackExchange.Redis;
using Throneteki.DeckValidation;
using Throneteki.Grpc.MappingProfiles;
using Throneteki.Lobby;
using Throneteki.Lobby.Models;
using Throneteki.Lobby.Redis;
using Throneteki.Lobby.Redis.Commands.Incoming;
using Throneteki.Lobby.Redis.Handlers;
using Throneteki.Models.Services;
using System.Reflection;
using Throneteki.Lobby.Commands;
using Throneteki.Lobby.Commands.Handlers;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSignalR();

var lobbySection = builder.Configuration.GetSection(LobbyOptions.OptionsName);
var lobbyOptions = new LobbyOptions();

lobbySection.Bind(lobbyOptions);

builder.Services.Configure<LobbyOptions>(lobbySection);

builder.Services.AddAutoMapper(typeof(GrpcMappingProfile).Assembly, typeof(MappingProfile).Assembly);
builder.Services.AddDeckValidation();

var authServerUrl = lobbyOptions.AuthServerUrl;

if (authServerUrl != null)
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("DontCare",
            policyBuilder => policyBuilder.WithOrigins(authServerUrl).AllowAnyHeader().AllowAnyMethod()
                .AllowCredentials());
    });
}

builder.Services.AddOpenIddict()
    .AddValidation(options =>
    {
        options.SetIssuer(lobbyOptions.AuthServerUrl ?? "Default");
        options.AddAudiences("throneteki-lobby");

        options.AddEncryptionKey(new SymmetricSecurityKey(
            Convert.FromBase64String("DRjd/GnduI3Efzen9V9BvbNUfc/VKgXltV7Kbk9sMkY=")));

        options.UseSystemNetHttp();
        options.UseAspNetCore();
    });

builder.Services.AddAuthentication(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);

builder.Services.AddSingleton(provider =>
    new ThronetekiServiceFactory(provider.GetRequiredService<HttpClient>(),
        provider.GetRequiredService<IOptions<LobbyOptions>>()).GetLobbyServiceClient());
builder.Services.AddSingleton<LobbyService>();
builder.Services.AddSingleton<IConnectionMultiplexer>(provider =>
    ConnectionMultiplexer.Connect(lobbyOptions.RedisUrl ?? throw new InvalidOperationException()));
builder.Services.AddSingleton<RedisCommandHandlerFactory>();
builder.Services.AddSingleton<GameNodeManager>();
builder.Services.AddTransient<IRedisCommandHandler<RedisIncomingMessage<HelloMessage>>, HelloMessageHandler>();
builder.Services.AddTransient<IRedisCommandHandler<RedisIncomingMessage<GameWonMessage>>, GameWonMessageHandler>();
builder.Services.AddTransient<IRedisCommandHandler<RedisIncomingMessage<GameClosedMessage>>, GameClosedMessageHandler>();
builder.Services.AddTransient<CardService>();

builder.Services.AddQuartz(q =>
{
    q.UseMicrosoftDependencyInjectionJobFactory();

    q.ScheduleJob<GameCleanupJob>(cfg =>
    {
        cfg.WithIdentity(nameof(GameCleanupJob))
            .StartNow()
            .WithSimpleSchedule(x => x
                .WithIntervalInMinutes(1)
                .RepeatForever());
    });

    q.ScheduleJob<GameNodeTimeoutJob>(cfg =>
    {
        cfg.WithIdentity(nameof(GameNodeTimeoutJob))
            .StartNow()
            .WithSimpleSchedule(x => x
                .WithIntervalInMinutes(1)
                .RepeatForever());
    });
});

builder.Services.AddQuartzHostedService(options =>
{
    options.WaitForJobsToComplete = true;
});

var assembly = Assembly.GetExecutingAssembly();
var implementations = assembly.GetTypes()
    .Where(t => t is { IsClass: true, IsAbstract: false } && t.GetInterfaces()
        .Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(ILobbyCommandHandler<>)))
    .ToList();

foreach (var implementation in implementations)
{
    var interfaceType = implementation.GetInterfaces()
        .Single(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(ILobbyCommandHandler<>));

    builder.Services.AddTransient(interfaceType, implementation);
}

implementations = assembly.GetTypes()
    .Where(t => t is { IsClass: true, IsAbstract: false } && typeof(ILobbyCommand).IsAssignableFrom(t))
    .ToList();

foreach (var implementation in implementations)
{
    var interfaces = implementation.GetInterfaces()
        .Where(i => typeof(ILobbyCommand).IsAssignableFrom(i));

    foreach (var @interface in interfaces)
    {
        builder.Services.AddTransient(@interface, implementation);
    }
}

builder.Services.AddTransient<LobbyCommandHandlerFactory>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
}

app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.UseCors("DontCare");

app.MapHub<LobbyHub>("/lobbyhub");

var gameNodeManager = app.Services.GetRequiredService<GameNodeManager>();

await gameNodeManager.Initialise();

app.Run();